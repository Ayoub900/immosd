import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const clientSchema = z.object({
    fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
    cin: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/clients - List all clients with pagination and filtering
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        // Build where clause
        const where: any = { deletedAt: undefined };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { cin: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count
        const total = await prisma.client.count({ where });

        // Get paginated clients
        const clients = await prisma.client.findMany({
            where,
            include: {
                purchases: {
                    where: { deletedAt: undefined },
                    include: {
                        flat: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            clients,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'فشل في جلب العملاء' },
            { status: 500 }
        );
    }
}

// POST /api/clients - Create new client
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = clientSchema.parse(body);

        // Check if phone already exists
        const existing = await prisma.client.findFirst({
            where: {
                phone: validated.phone,
                // No filter needed
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'رقم الهاتف مسجل بالفعل' },
                { status: 400 }
            );
        }

        const client = await prisma.client.create({
            data: validated,
        });

        // Audit log: Track client creation with real user data
        try {
            const { auth } = await import('@/lib/auth');
            const { createAuditLog, getRequestMetadata } = await import('@/lib/audit-logger');

            const session = await auth.api.getSession({ headers: request.headers });

            if (session?.user) {
                await createAuditLog({
                    userId: session.user.id,
                    userName: session.user.name,
                    action: 'CREATE',
                    entityType: 'client',
                    entityId: client.id,
                    entityName: client.fullName,
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء العميل' },
            { status: 500 }
        );
    }
}
