import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePaymentSummary } from '@/lib/payment-calculator';

// GET /api/purchases/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                client: true,
                flat: true,
                payments: {
                    where: {},
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'عملية الشراء غير موجودة' },
                { status: 404 }
            );
        }

        const summary = await calculatePaymentSummary(purchase.id);

        return NextResponse.json({
            ...purchase,
            paymentSummary: summary,
        });
    } catch (error) {
        console.error('Error fetching purchase:', error);
        return NextResponse.json(
            { error: 'فشل في جلب بيانات عملية الشراء' },
            { status: 500 }
        );
    }
}

// DELETE /api/purchases/[id] - Soft delete purchase (reverts flat to AVAILABLE)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                flat: true,
            },
        });

        if (!purchase) {
            return NextResponse.json(
                { error: 'عملية الشراء غير موجودة' },
                { status: 404 }
            );
        }

        // Soft delete purchase
        await prisma.purchase.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Soft delete all payments
        await prisma.payment.updateMany({
            where: { purchaseId: id },
            data: { deletedAt: new Date() },
        });

        // Revert flat to AVAILABLE
        await prisma.flat.update({
            where: { id: purchase.flatId },
            data: { status: 'AVAILABLE' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase:', error);
        return NextResponse.json(
            { error: 'فشل في حذف عملية الشراء' },
            { status: 500 }
        );
    }
}
