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

        // Build where clause for filtering. All filtering, search and pagination is
        // pushed down to the database so we never load the entire expenses collection
        // into memory.
        const and: any[] = [
            {
                OR: [
                    { deletedAt: { isSet: false } },
                    { deletedAt: null },
                ],
            },
        ];

        // Category filter
        if (category) {
            and.push({ category });
        }

        // Date range filter
        if (dateFrom || dateTo) {
            const expenseDate: any = {};
            if (dateFrom) expenseDate.gte = dateFrom;
            if (dateTo) expenseDate.lte = dateTo;
            and.push({ expenseDate });
        }

        // Amount range filter
        if (amountMin !== undefined || amountMax !== undefined) {
            const amount: any = {};
            if (amountMin !== undefined) amount.gte = amountMin;
            if (amountMax !== undefined) amount.lte = amountMax;
            and.push({ amount });
        }

        // Building filter
        if (buildingId) {
            and.push({ buildingId });
        }

        // Flat filter
        if (flatId) {
            and.push({ flatId });
        }

        const where = { AND: and };

        const include = {
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
        } as const;

        // Search spans related fields (building name / flat reference). Prisma's
        // MongoDB connector can't reliably filter across these relations (it errors on
        // rows whose relation is null), so when searching we fetch the scalar-filtered
        // rows and match/paginate in memory. Without a search term we paginate at the
        // database level.
        if (search) {
            const matching = await prisma.expense.findMany({
                where,
                include,
                orderBy: { createdAt: 'desc' },
            });

            const searchLower = search.toLowerCase();
            const filtered = matching.filter((expense) =>
                expense.description.toLowerCase().includes(searchLower) ||
                expense.building?.name.toLowerCase().includes(searchLower) ||
                expense.flat?.referenceNum.toLowerCase().includes(searchLower)
            );

            const total = filtered.length;
            const startIndex = (page - 1) * limit;
            const expenses = filtered.slice(startIndex, startIndex + limit);

            return NextResponse.json({
                expenses,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        }

        const [total, expenses] = await Promise.all([
            prisma.expense.count({ where }),
            prisma.expense.findMany({
                where,
                include,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

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
