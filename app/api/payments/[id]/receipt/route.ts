import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePaymentSummary } from '@/lib/payment-calculator';

// GET /api/payments/[id]/receipt - Generate and download receipt PDF
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get payment with all related data
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                purchase: {
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
                                        area: true,
                                        projectLocation: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 });
        }

        // Calculate payment summary
        const summary = await calculatePaymentSummary(payment.purchaseId);
        if (!summary) {
            return NextResponse.json({ error: 'فشل في حساب ملخص الدفعات' }, { status: 500 });
        }


        // Generate PDF using React-PDF
        const { generatePaymentReceiptBuffer } = await import('@/lib/pdf-generator');
        const pdfBuffer = await generatePaymentReceiptBuffer({
            receiptNum: payment.receiptNum,
            clientName: payment.purchase.client.fullName,
            clientCin: payment.purchase.client.cin || undefined,
            clientAddress: payment.purchase.client.address || undefined,
            flatReference: payment.purchase.flat.referenceNum,
            propertyType: payment.purchase.flat.propertyType || 'APARTMENT',
            buildingName: payment.purchase.flat.building.name,
            buildingAddress: payment.purchase.flat.building.address || undefined,
            buildingPlotNumber: payment.purchase.flat.building.plotNumber || undefined,
            buildingArea: payment.purchase.flat.building.area || undefined,
            projectLocation: payment.purchase.flat.building.projectLocation || undefined,
            paymentAmount: payment.amount,
            paymentDate: payment.paymentDate,
            totalPaid: summary.totalPaid,
            remaining: summary.remaining,
            agreedPrice: summary.agreedPrice,
        });


        // Return PDF as download (convert Buffer to Uint8Array for NextResponse)
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=\"receipt-${payment.receiptNum}.pdf\"`,
            },
        });
    } catch (error) {
        console.error('Error generating receipt:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الإيصال' }, { status: 500 });
    }
}
