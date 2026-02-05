import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/flats/[id]/merge - Merge two half flats back into a full flat
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the flat to merge
        const flat = await prisma.flat.findUnique({
            where: { id },
            include: {
                purchase: true,
            },
        });

        if (!flat) {
            return NextResponse.json({ error: 'الشقة غير موجودة' }, { status: 404 });
        }

        // Validate flat type
        if (flat.flatType === 'FULL') {
            return NextResponse.json(
                { error: 'لا يمكن دمج شقة كاملة - يجب أن تكون نصف شقة' },
                { status: 400 }
            );
        }

        // Check if flat is sold or reserved
        if (flat.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: 'لا يمكن دمج شقة محجوزة أو مباعة' },
                { status: 400 }
            );
        }

        // Find sibling flat on the same floor and building
        const siblingType = flat.flatType === 'HALF_RIGHT' ? 'HALF_LEFT' : 'HALF_RIGHT';
        const siblingFlat = await prisma.flat.findFirst({
            where: {
                buildingId: flat.buildingId,
                floorNum: flat.floorNum,
                flatType: siblingType,
                id: { not: id },
            },
            include: {
                purchase: true,
            },
        });

        if (!siblingFlat) {
            return NextResponse.json(
                { error: 'لم يتم العثور على النصف الآخر من الشقة' },
                { status: 404 }
            );
        }

        // Check if sibling is available
        if (siblingFlat.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: 'النصف الآخر من الشقة محجوز أو مبيع' },
                { status: 400 }
            );
        }

        // Check if they share the same parent
        if (flat.parentFlatId !== siblingFlat.parentFlatId) {
            return NextResponse.json(
                { error: 'الشقتان ليستا من نفس الشقة الأصلية' },
                { status: 400 }
            );
        }

        // If they have a parent, restore it
        if (flat.parentFlatId) {
            // Delete both half flats and restore parent
            await prisma.$transaction([
                prisma.flat.delete({ where: { id: flat.id } }),
                prisma.flat.delete({ where: { id: siblingFlat.id } }),
                prisma.flat.update({
                    where: { id: flat.parentFlatId },
                    data: {
                        status: 'AVAILABLE',
                        deletedAt: null,
                    },
                }),
            ]);

            const mergedFlat = await prisma.flat.findUnique({
                where: { id: flat.parentFlatId },
            });

            return NextResponse.json({
                message: 'تم دمج الشقتين بنجاح',
                flat: mergedFlat,
            });
        } else {
            // Create new full flat (shouldn't happen normally, but handle it)
            return NextResponse.json(
                { error: 'لا يمكن دمج شقق بدون شقة أصلية' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error merging flats:', error);
        return NextResponse.json(
            { error: 'فشل في دمج الشقق' },
            { status: 500 }
        );
    }
}
