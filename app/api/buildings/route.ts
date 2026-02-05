import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/buildings - List all buildings with stats and pagination
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        // Build where clause
        const where: any = {
            deletedAt: null, // Only non-deleted buildings
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { plotNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count
        const total = await prisma.building.count({ where });

        // Get paginated buildings
        const buildings = await prisma.building.findMany({
            where,
            include: {
                flats: {
                    select: {
                        id: true,
                        status: true,
                        floorNum: true,
                        deletedAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Calculate stats for each building
        const buildingsWithStats = buildings.map((building) => {
            // Filter out soft-deleted flats (check for both null and undefined)
            const activeFlats = building.flats.filter((f) => !f.deletedAt);

            const totalFlats = activeFlats.length;
            const availableFlats = activeFlats.filter((f) => f.status === 'AVAILABLE').length;
            const reservedFlats = activeFlats.filter((f) => f.status === 'RESERVED').length;
            const soldFlats = activeFlats.filter((f) => f.status === 'SOLD').length;

            // Get unique floor numbers
            const floors = [...new Set(activeFlats.map((f) => f.floorNum))].sort();

            return {
                ...building,
                stats: {
                    totalFlats,
                    availableFlats,
                    reservedFlats,
                    soldFlats,
                    floors: floors.length,
                    floorNumbers: floors,
                },
                flats: activeFlats, // Return only active flats
            };
        });

        return NextResponse.json({
            buildings: buildingsWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching buildings:', error);
        return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
    }
}

// POST /api/buildings - Create new building
const buildingSchema = z.object({
    name: z.string().min(1, 'اسم المبنى مطلوب'),
    address: z.string().optional(),
    plotNumber: z.string().optional(),
    area: z.number().positive().optional(),
    projectLocation: z.string().optional(),
    totalFloors: z.number().int().min(1).default(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = buildingSchema.parse(body);

        const building = await prisma.building.create({
            data: {
                ...validated,
                deletedAt: null, // Explicitly set to null so filter works
            },
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
                    action: 'CREATE',
                    entityType: 'building',
                    entityId: building.id,
                    entityName: building.name,
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        return NextResponse.json(building, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error creating building:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء البناية' },
            { status: 500 }
        );
    }
}
