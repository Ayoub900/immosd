import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePaymentSummary } from '@/lib/payment-calculator';
import { z } from 'zod';

const purchaseSchema = z.object({
    clientId: z.string(),
    flatId: z.string(),
    agreedPrice: z.number().positive(),
});

// GET /api/purchases - List all purchases with pagination and filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        // Build where clause
        const where: any = { deletedAt: undefined };

        if (search) {
            where.OR = [
                { client: { fullName: { contains: search, mode: 'insensitive' } } },
                { flat: { referenceNum: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (status && (status === 'IN_PROGRESS' || status === 'COMPLETED')) {
            where.status = status;
        }

        // Get total count
        const total = await prisma.purchase.count({ where });

        // Get paginated purchases
        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                client: true,
                flat: true,
                payments: {
                    where: {},
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Add payment summaries
        const purchasesWithSummaries = await Promise.all(
            purchases.map(async (purchase: typeof purchases[0]) => {
                const summary = await calculatePaymentSummary(purchase.id);
                return {
                    ...purchase,
                    paymentSummary: summary,
                };
            })
        );

        return NextResponse.json({
            purchases: purchasesWithSummaries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return NextResponse.json(
            { error: 'فشل في جلب عمليات الشراء' },
            { status: 500 }
        );
    }
}

// POST /api/purchases - Create new purchase (بيع شقة)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = purchaseSchema.parse(body);

        // Verify client exists
        const client = await prisma.client.findUnique({
            where: { id: validated.clientId },
        });

        if (!client) {
            return NextResponse.json(
                { error: 'العميل غير موجود' },
                { status: 404 }
            );
        }

        // Verify flat exists and is available
        const flat = await prisma.flat.findUnique({
            where: { id: validated.flatId },
            include: {
                purchase: {
                    where: {},
                },
            },
        });

        if (!flat) {
            return NextResponse.json(
                { error: 'الشقة غير موجودة' },
                { status: 404 }
            );
        }

        if (flat.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: 'الشقة غير متاحة' },
                { status: 400 }
            );
        }

        if (flat.purchase) {
            return NextResponse.json(
                { error: 'الشقة محجوزة بالفعل' },
                { status: 400 }
            );
        }

        // Create purchase
        const purchase = await prisma.purchase.create({
            data: {
                clientId: validated.clientId,
                flatId: validated.flatId,
                agreedPrice: validated.agreedPrice,
                status: 'IN_PROGRESS',
            },
            include: {
                client: true,
                flat: true,
            },
        });

        // Update flat status to RESERVED
        await prisma.flat.update({
            where: { id: validated.flatId },
            data: { status: 'RESERVED' },
        });

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error creating purchase:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء عملية الشراء' },
            { status: 500 }
        );
    }
}
