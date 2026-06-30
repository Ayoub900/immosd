import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
    calculatePaymentSummary,
    validatePaymentAmount,
    shouldCompletePurchase,
} from '@/lib/payment-calculator';
import { generateReceiptNumber } from '@/lib/reference-generator';
import { generatePaymentReceipt } from '@/lib/pdf-generator';
import { z } from 'zod';

// GET /api/payments - List all payments with pagination and filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
        const amountMin = searchParams.get('amountMin') ? parseFloat(searchParams.get('amountMin')!) : undefined;
        const amountMax = searchParams.get('amountMax') ? parseFloat(searchParams.get('amountMax')!) : undefined;

        // Build where clause for filtering. Everything (date, amount, search and
        // pagination) is pushed down to the database so we never load the whole
        // payments collection into memory — each row carries a large base64 PDF in
        // `receiptUrl`, so fetching them all blows up memory once enough payments exist.
        const and: any[] = [
            {
                OR: [
                    { deletedAt: { isSet: false } },
                    { deletedAt: null },
                ],
            },
        ];

        // Date range filter
        if (dateFrom || dateTo) {
            const paymentDate: any = {};
            if (dateFrom) paymentDate.gte = dateFrom;
            if (dateTo) paymentDate.lte = dateTo;
            and.push({ paymentDate });
        }

        // Amount range filter
        if (amountMin !== undefined || amountMax !== undefined) {
            const amount: any = {};
            if (amountMin !== undefined) amount.gte = amountMin;
            if (amountMax !== undefined) amount.lte = amountMax;
            and.push({ amount });
        }

        const where = { AND: and };

        // Lightweight projection — exclude the heavy base64 `receiptUrl` so we never
        // load the PDFs into memory (and the sort can use the createdAt index).
        const select = {
            id: true,
            purchaseId: true,
            amount: true,
            paymentDate: true,
            receiptNum: true,
            createdAt: true,
            purchase: {
                select: {
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    flat: {
                        select: {
                            id: true,
                            referenceNum: true,
                        },
                    },
                },
            },
        } as const;

        // Search spans related fields (client name / flat reference). Prisma's MongoDB
        // connector can't reliably filter across these relations (it errors on rows
        // whose relation is null), so when searching we fetch the scalar-filtered rows
        // — without the heavy receiptUrl — and match/paginate in memory. Without a
        // search term we paginate at the database level, which scales regardless of size.
        if (search) {
            const matching = await prisma.payment.findMany({
                where,
                select,
                orderBy: { createdAt: 'desc' },
            });

            const searchLower = search.toLowerCase();
            const filtered = matching.filter((payment) =>
                payment.receiptNum.toLowerCase().includes(searchLower) ||
                payment.purchase.client.fullName.toLowerCase().includes(searchLower) ||
                payment.purchase.flat.referenceNum.toLowerCase().includes(searchLower)
            );

            const total = filtered.length;
            const startIndex = (page - 1) * limit;
            const payments = filtered.slice(startIndex, startIndex + limit);

            return NextResponse.json({
                payments,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        }

        const [total, payments] = await Promise.all([
            prisma.payment.count({ where }),
            prisma.payment.findMany({
                where,
                select,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return NextResponse.json({
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'فشل في جلب الدفعات' }, { status: 500 });
    }
}

const paymentSchema = z.object({
    purchaseId: z.string(),
    amount: z.number().positive(),
    paymentDate: z.string().transform((str) => new Date(str)),
});

// POST /api/payments - Create new payment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = paymentSchema.parse(body);

        // Validate payment amount
        const validation = await validatePaymentAmount(
            validated.purchaseId,
            validated.amount
        );

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Get purchase details
        const purchase = await prisma.purchase.findUnique({
            where: { id: validated.purchaseId },
            include: {
                client: {
                    select: {
                        fullName: true,
                        cin: true,
                        address: true,
                    },
                },
                flat: {
                    select: {
                        referenceNum: true,
                        propertyType: true,
                        building: {
                            select: {
                                name: true,
                                address: true,
                                plotNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'عملية الشراء غير موجودة' },
                { status: 404 }
            );
        }

        // Generate receipt number
        const receiptNum = await generateReceiptNumber();

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                purchaseId: validated.purchaseId,
                amount: validated.amount,
                paymentDate: validated.paymentDate,
                receiptNum,
            },
        });

        // Calculate new totals
        const summary = await calculatePaymentSummary(validated.purchaseId);
        if (!summary) {
            throw new Error('Failed to calculate payment summary');
        }

        // Generate PDF receipt using React-PDF
        const { generatePaymentReceiptDataUrl } = await import('@/lib/pdf-generator');
        const pdfDataUrl = await generatePaymentReceiptDataUrl({
            receiptNum: payment.receiptNum,
            clientName: purchase.client.fullName,
            clientCin: purchase.client.cin || undefined,
            clientAddress: purchase.client.address || undefined,
            flatReference: purchase.flat.referenceNum,
            propertyType: purchase.flat.propertyType || 'APARTMENT',
            buildingName: purchase.flat.building.name,
            buildingAddress: purchase.flat.building.address || undefined,
            buildingPlotNumber: purchase.flat.building.plotNumber || undefined,
            paymentAmount: payment.amount,
            paymentDate: payment.paymentDate,
            totalPaid: summary.totalPaid,
            remaining: summary.remaining,
            agreedPrice: summary.agreedPrice,
        });

        await prisma.payment.update({
            where: { id: payment.id },
            data: { receiptUrl: pdfDataUrl },
        });

        // Check if purchase should be completed
        const isComplete = await shouldCompletePurchase(validated.purchaseId);
        if (isComplete) {
            await prisma.purchase.update({
                where: { id: validated.purchaseId },
                data: { status: 'COMPLETED' },
            });

            // Update flat status
            await prisma.flat.update({
                where: { id: purchase.flatId },
                data: { status: 'SOLD' },
            });
        }

        // Return payment with PDF
        return NextResponse.json(
            {
                ...payment,
                pdfDataUrl,
                purchaseCompleted: isComplete,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error creating payment:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء الدفعة' },
            { status: 500 }
        );
    }
}
