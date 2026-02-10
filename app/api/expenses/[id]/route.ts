import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/expenses/[id] - Get single expense
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                building: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                flat: {
                    select: {
                        id: true,
                        referenceNum: true,
                    },
                },
            },
        });

        if (!expense || expense.deletedAt) {
            return NextResponse.json(
                { error: 'المصروف غير موجود' },
                { status: 404 }
            );
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json(
            { error: 'فشل في جلب المصروف' },
            { status: 500 }
        );
    }
}

const updateExpenseSchema = z.object({
    description: z.string().min(1, 'الوصف مطلوب').optional(),
    amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر').optional(),
    category: z.enum(['MAINTENANCE', 'UTILITIES', 'SALARIES', 'MARKETING', 'LEGAL', 'OTHER']).optional(),
    expenseDate: z.string().transform((str) => new Date(str)).optional(),
    notes: z.string().optional(),
    buildingId: z.string().nullable().optional(),
    flatId: z.string().nullable().optional(),
});

// PUT /api/expenses/[id] - Update expense
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateExpenseSchema.parse(body);

        // Check if expense exists
        const existing = await prisma.expense.findUnique({
            where: { id },
        });

        if (!existing || existing.deletedAt) {
            return NextResponse.json(
                { error: 'المصروف غير موجود' },
                { status: 404 }
            );
        }

        // Update expense
        const expense = await prisma.expense.update({
            where: { id },
            data: validated,
            include: {
                building: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                flat: {
                    select: {
                        id: true,
                        referenceNum: true,
                    },
                },
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error updating expense:', error);
        return NextResponse.json(
            { error: 'فشل في تحديث المصروف' },
            { status: 500 }
        );
    }
}

// DELETE /api/expenses/[id] - Soft delete expense
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Check if expense exists
        const existing = await prisma.expense.findUnique({
            where: { id },
        });

        if (!existing || existing.deletedAt) {
            return NextResponse.json(
                { error: 'المصروف غير موجود' },
                { status: 404 }
            );
        }

        // Soft delete
        const expenseDeleted = await prisma.expense.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        console.log(expenseDeleted);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            { error: 'فشل في حذف المصروف' },
            { status: 500 }
        );
    }
}
