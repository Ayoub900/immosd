/**
 * Payment calculation utilities
 * Handles all payment-related calculations for purchases
 */

import prisma from './prisma';

export interface PaymentSummary {
    totalPaid: number;
    remaining: number;
    agreedPrice: number;
    isFullyPaid: boolean;
}

/**
 * Calculate payment summary for a purchase
 */
export async function calculatePaymentSummary(
    purchaseId: string
): Promise<PaymentSummary | null> {
    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
            payments: {},
        },
    });

    if (!purchase) return null;

    const totalPaid = purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = purchase.agreedPrice - totalPaid;
    const isFullyPaid = remaining <= 0;

    return {
        totalPaid,
        remaining: Math.max(0, remaining),
        agreedPrice: purchase.agreedPrice,
        isFullyPaid,
    };
}

/**
 * Validate payment amount
 */
export async function validatePaymentAmount(
    purchaseId: string,
    amount: number
): Promise<{ valid: boolean; error?: string }> {
    if (amount <= 0) {
        return { valid: false, error: 'المبلغ يجب أن يكون أكبر من الصفر' };
    }

    const summary = await calculatePaymentSummary(purchaseId);
    if (!summary) {
        return { valid: false, error: 'عملية الشراء غير موجودة' };
    }

    if (amount > summary.remaining) {
        return {
            valid: false,
            error: `المبلغ أكبر من المتبقي (${summary.remaining.toLocaleString('ar-MA')} درهم)`,
        };
    }

    return { valid: true };
}

/**
 * Check if purchase should be completed after payment
 */
export async function shouldCompletePurchase(purchaseId: string): Promise<boolean> {
    const summary = await calculatePaymentSummary(purchaseId);
    return summary?.isFullyPaid ?? false;
}
