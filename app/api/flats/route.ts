import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateFlatReference } from '@/lib/reference-generator';
import { z } from 'zod';

const flatSchema = z.object({
    buildingId: z.string().min(1, 'معرف المبنى مطلوب'),
    floorNum: z.number().int().positive(),
    flatType: z.enum(['FULL', 'HALF_RIGHT', 'HALF_LEFT']).optional().default('FULL'),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD']).optional().default('AVAILABLE'),
});

// GET /api/flats - List all flats grouped by floor
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const buildingId = searchParams.get('buildingId');

        const where: any = {};
        if (buildingId) {
            where.buildingId = buildingId;
        }

        const flats = await prisma.flat.findMany({
            where,
            include: {
                building: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { floorNum: 'asc' },
                { referenceNum: 'asc' },
            ],
        });

        console.log('Flats query result:', flats.length, 'flats found');

        // Group by floor
        const floorMap = new Map<number, typeof flats>();
        flats.forEach((flat: typeof flats[number]) => {
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
            .sort((a, b) => b.floorNum - a.floorNum); // Descending

        console.log('Returning:', floors.length, 'floors');

        return NextResponse.json({ floors, flats });
    } catch (error) {
        console.error('Error fetching flats:', error);
        return NextResponse.json({ error: 'فشل في جلب الشقق' }, { status: 500 });
    }
}

// POST /api/flats - Create a new flat
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = flatSchema.parse(body);

        // Generate reference number with building
        const referenceNum = await generateFlatReference(
            validated.buildingId,
            validated.floorNum,
            validated.flatType
        );

        const flat = await prisma.flat.create({
            data: {
                ...validated,
                referenceNum,
            },
        });

        return NextResponse.json(flat, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating flat:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الشقة' }, { status: 500 });
    }
}
