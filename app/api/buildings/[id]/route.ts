import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/buildings/[id] - Get building with all floors and flats
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const building = await prisma.building.findUnique({
            where: { id },
            include: {
                flats: {
                    orderBy: [
                        { floorNum: 'asc' },
                        { referenceNum: 'asc' },
                    ],
                },
            },
        });

        if (!building) {
            return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
        }

        // Filter out soft-deleted flats (check for both null and undefined)
        const activeFlats = building.flats.filter(f => !f.deletedAt);

        // Group active flats by floor
        const floorMap = new Map<number, typeof activeFlats>();
        activeFlats.forEach((flat) => {
            if (!floorMap.has(flat.floorNum)) {
                floorMap.set(flat.floorNum, []);
            }
            floorMap.get(flat.floorNum)!.push(flat);
        });

        const floors = Array.from(floorMap.entries())
            .map(([floorNum, flats]) => ({
                floorNum,
                flats,
            }))
            .sort((a, b) => b.floorNum - a.floorNum); // Top floor first

        // Calculate stats (only active flats)
        const stats = {
            totalFlats: activeFlats.length,
            availableFlats: activeFlats.filter((f) => f.status === 'AVAILABLE').length,
            reservedFlats: activeFlats.filter((f) => f.status === 'RESERVED').length,
            soldFlats: activeFlats.filter((f) => f.status === 'SOLD').length,
            totalValue: 0, // Removed - price now only exists in Purchase
        };

        return NextResponse.json({
            ...building,
            floors,
            stats,
        });
    } catch (error) {
        console.error('Error fetching building:', error);
        return NextResponse.json({ error: 'فشل في جلب بيانات المبنى' }, { status: 500 });
    }
}

// PATCH /api/buildings/[id] - Update building
const updateSchema = z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    plotNumber: z.string().optional(),
    area: z.number().positive().optional(),
    projectLocation: z.string().optional(),
    totalFloors: z.number().int().min(1).optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateSchema.partial().parse(body);

        const before = await prisma.building.findUnique({ where: { id } });

        const building = await prisma.building.update({
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
                    entityType: 'building',
                    entityId: id,
                    entityName: building.name,
                    changes: { before, after: building },
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        return NextResponse.json(building);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error updating building:', error);
        return NextResponse.json({ error: 'فشل في تحديث المبنى' }, { status: 500 });
    }
}

// DELETE /api/buildings/[id] - Soft delete building
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const building = await prisma.building.findUnique({ where: { id } });

        // Soft delete building
        await prisma.building.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Soft delete all flats in this building
        await prisma.flat.updateMany({
            where: { buildingId: id },
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
                    entityType: 'building',
                    entityId: id,
                    entityName: building?.name || id,
                    ...getRequestMetadata(request),
                });
            }
        } catch (logError) {
            console.error('Audit logging failed:', logError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting building:', error);
        return NextResponse.json(
            { error: 'فشل في حذف البناية' },
            { status: 500 }
        );
    }
}
