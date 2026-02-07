import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateFlatReference } from '@/lib/reference-generator';

// POST /api/flats/[id]/split - Split a full flat into two halves
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { priceRight, priceLeft } = body;

        // Get the parent flat
        const parentFlat = await prisma.flat.findUnique({
            where: { id },
            include: {
                purchase: {
                    where: {},
                },
            },
        });

        if (!parentFlat) {
            return NextResponse.json({ error: 'الشقة غير موجودة' }, { status: 404 });
        }

        if (parentFlat.flatType !== 'FULL') {
            return NextResponse.json(
                { error: 'يمكن تقسيم الشقق الكاملة فقط' },
                { status: 400 }
            );
        }

        if (parentFlat.purchase) {
            return NextResponse.json(
                { error: 'لا يمكن تقسيم شقة في عملية شراء نشطة' },
                { status: 400 }
            );
        }

        if (parentFlat.status === 'SOLD') {
            return NextResponse.json(
                { error: 'لا يمكن تقسيم شقة مباعة' },
                { status: 400 }
            );
        }

        // Generate reference numbers for halves
        const rightRef = await generateFlatReference(
            parentFlat.buildingId,
            parentFlat.floorNum,
            'HALF_RIGHT',
            parentFlat.referenceNum
        );
        const leftRef = await generateFlatReference(
            parentFlat.buildingId,
            parentFlat.floorNum,
            'HALF_LEFT',
            parentFlat.referenceNum
        );

        // Create the two half flats
        const [rightFlat, leftFlat] = await prisma.$transaction([
            prisma.flat.create({
                data: {
                    referenceNum: rightRef,
                    buildingId: parentFlat.buildingId,
                    floorNum: parentFlat.floorNum,
                    flatType: 'HALF_RIGHT',
                    propertyType: parentFlat.propertyType,
                    status: 'AVAILABLE',
                    parentFlatId: parentFlat.id,
                },
            }),
            prisma.flat.create({
                data: {
                    referenceNum: leftRef,
                    buildingId: parentFlat.buildingId,
                    floorNum: parentFlat.floorNum,
                    flatType: 'HALF_LEFT',
                    propertyType: parentFlat.propertyType,
                    status: 'AVAILABLE',
                    parentFlatId: parentFlat.id,
                },
            }),
        ]);

        // Soft-delete parent flat (hide it from view)
        await prisma.flat.update({
            where: { id: parentFlat.id },
            data: {
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            flats: [rightFlat, leftFlat],
        });
    } catch (error) {
        console.error('Error splitting flat:', error);
        return NextResponse.json(
            { error: 'فشل في تقسيم الشقة' },
            { status: 500 }
        );
    }
}
