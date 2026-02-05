import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { shouldCompletePurchase } from '@/lib/payment-calculator';

// DELETE /api/payments/[id] - Soft delete payment (recalculates totals)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                purchase: {
                    include: {
                        flat: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'الدفعة غير موجودة' },
                { status: 404 }
            );
        }

        // Soft delete payment
        await prisma.payment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Recalculate and update purchase status
        const isComplete = await shouldCompletePurchase(payment.purchaseId);

        if (!isComplete) {
            // If was completed and now isn't, revert to IN_PROGRESS
            await prisma.purchase.update({
                where: { id: payment.purchaseId },
                data: { status: 'IN_PROGRESS' },
            });

            // Revert flat status to RESERVED
            await prisma.flat.update({
                where: { id: payment.purchase.flatId },
                data: { status: 'RESERVED' },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json(
            { error: 'فشل في حذف الدفعة' },
            { status: 500 }
        );
    }
}
