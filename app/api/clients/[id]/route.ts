import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePaymentSummary } from '@/lib/payment-calculator';
import { z } from 'zod';

const clientSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    cin: z.string().optional(),
    address: z.string().optional(),
    fullNameFr: z.string().optional(),
    addressFr: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/clients/[id] - Get client details with purchases and payment summaries
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                purchases: {
                    where: {},
                    include: {
                        flat: true,
                        payments: {
                            where: {},
                            orderBy: { paymentDate: 'desc' },
                        },
                    },
                },
            },
        });

        if (!client) {
            return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
        }

        // Calculate payment summaries for each purchase
        const purchasesWithSummaries = await Promise.all(
            client.purchases.map(async (purchase: typeof client.purchases[0]) => {
                const summary = await calculatePaymentSummary(purchase.id);
                return {
                    ...purchase,
                    paymentSummary: summary,
                };
            })
        );

        return NextResponse.json({
            ...client,
            purchases: purchasesWithSummaries,
        });
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'فشل في جلب بيانات العميل' },
            { status: 500 }
        );
    }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = clientSchema.partial().parse(body);

        // Get before state for audit log
        const before = await prisma.client.findUnique({ where: { id } });

        // If updating phone, check uniqueness
        if (validated.phone) {
            const existing = await prisma.client.findFirst({
                where: {
                    phone: validated.phone,
                    id: { not: id },
                    // No filter needed
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'رقم الهاتف مسجل بالفعل' },
                    { status: 400 }
                );
            }
        }

        const client = await prisma.client.update({
            where: { id },
            data: validated,
        });

        // Audit log
        try {
            const { auth } = await import('@/lib/auth');
            const { createAuditLog, getRequestMetadata } = await import('@/lib/audit-logger');
            const session = await auth.api.getSession({ headers: request.headers });

            if (session?.user) {
                await createAuditLog({
                    userId: session.user.id,
                    userName: session.user.name,
                    action: 'UPDATE',
                    entityType: 'client',
                    entityId: id,
                    entityName: client.fullName,
                    changes: { before, after: client },
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        return NextResponse.json(client);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'فشل في تحديث العميل' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id] - Soft delete client (cascades to purchases and payments)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await prisma.client.findUnique({ where: { id } });

        // Soft delete client
        await prisma.client.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Audit log
        try {
            const { auth } = await import('@/lib/auth');
            const { createAuditLog, getRequestMetadata } = await import('@/lib/audit-logger');
            const session = await auth.api.getSession({ headers: request.headers });

            if (session?.user) {
                await createAuditLog({
                    userId: session.user.id,
                    userName: session.user.name,
                    action: 'DELETE',
                    entityType: 'client',
                    entityId: id,
                    entityName: client?.fullName || id,
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        // Soft delete all purchases
        const purchases = await prisma.purchase.findMany({
            where: { clientId: id },
        });

        for (const purchase of purchases) {
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { deletedAt: new Date() },
            });

            // Soft delete all payments for this purchase
            await prisma.payment.updateMany({
                where: { purchaseId: purchase.id },
                data: { deletedAt: new Date() },
            });

            // Return flat to available status
            await prisma.flat.update({
                where: { id: purchase.flatId },
                data: { status: 'AVAILABLE' },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'فشل في حذف العميل' },
            { status: 500 }
        );
    }
}
