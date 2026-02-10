import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/expenses - List all expenses with pagination and filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
        const amountMin = searchParams.get('amountMin') ? parseFloat(searchParams.get('amountMin')!) : undefined;
        const amountMax = searchParams.get('amountMax') ? parseFloat(searchParams.get('amountMax')!) : undefined;
        const buildingId = searchParams.get('buildingId') || '';
        const flatId = searchParams.get('flatId') || '';

        // Build where clause for filtering
        const where: any = {};

        // Category filter
        if (category) {
            where.category = category;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.expenseDate = {};
            if (dateFrom) where.expenseDate.gte = dateFrom;
            if (dateTo) where.expenseDate.lte = dateTo;
        }

        // Amount range filter
        if (amountMin !== undefined || amountMax !== undefined) {
            where.amount = {};
            if (amountMin !== undefined) where.amount.gte = amountMin;
            if (amountMax !== undefined) where.amount.lte = amountMax;
        }

        // Building filter
        if (buildingId) {
            where.buildingId = buildingId;
        }

        // Get all matching expenses
        const allExpenses = await prisma.expense.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        });

        // Filter out deleted expenses (those with deletedAt set)
        let filteredExpenses = allExpenses.filter(expense => !expense.deletedAt);

        // Filter by search term in memory (description, building name, flat reference)
        if (search) {
            const searchLower = search.toLowerCase();
            filteredExpenses = filteredExpenses.filter(expense =>
                expense.description.toLowerCase().includes(searchLower) ||
                expense.building?.name.toLowerCase().includes(searchLower) ||
                expense.flat?.referenceNum.toLowerCase().includes(searchLower)
            );
        }

        // Pagination
        const total = filteredExpenses.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const expenses = filteredExpenses.slice(startIndex, endIndex);

        return NextResponse.json({
            expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'فشل في جلب المصروفات' }, { status: 500 });
    }
}

const expenseSchema = z.object({
    description: z.string().min(1, 'الوصف مطلوب'),
    amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
    category: z.enum(['MAINTENANCE', 'UTILITIES', 'SALARIES', 'MARKETING', 'LEGAL', 'OTHER']),
    expenseDate: z.string().transform((str) => new Date(str)),
    notes: z.string().optional(),
    buildingId: z.string().optional(),
    flatId: z.string().optional(),
});

// POST /api/expenses - Create new expense
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = expenseSchema.parse(body);

        // Create expense
        const expense = await prisma.expense.create({
            data: {
                description: validated.description,
                amount: validated.amount,
                category: validated.category,
                expenseDate: validated.expenseDate,
                notes: validated.notes,
                buildingId: validated.buildingId || null,
                flatId: validated.flatId || null,
            },
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

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error creating expense:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء المصروف' },
            { status: 500 }
        );
    }
}
