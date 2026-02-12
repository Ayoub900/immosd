import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateFlatReference } from '@/lib/reference-generator';
import { z } from 'zod';

const bulkCreateSchema = z.object({
    buildingId: z.string().min(1, 'معرف المبنى مطلوب'),
    floorNum: z.number().int().positive('رقم الطابق يجب أن يكون موجب'),
    count: z.number().int().min(1).max(4, 'يمكن إنشاء من 1 إلى 4 شقق فقط'),
    propertyType: z.enum(['APARTMENT', 'COMMERCIAL_STORE']).optional().default('APARTMENT'),
});

// Helper function to generate flat type based on count and position
function getFlatType(count: number, position: number): 'FULL' | 'HALF_LEFT' | 'HALF_RIGHT' {
    if (count === 1) return 'FULL';
    if (count === 2) return position === 1 ? 'HALF_LEFT' : 'HALF_RIGHT';
    // For 3 or 4 flats, we use FULL for now (can be extended later)
    return 'FULL';
}


// POST /api/flats/bulk-create - Create multiple flats for a floor
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = bulkCreateSchema.parse(body);

        const { buildingId, floorNum, count, propertyType } = validated;

        // Verify building exists
        const building = await prisma.building.findUnique({
            where: { id: buildingId },
        });

        if (!building) {
            return NextResponse.json(
                { error: 'المبنى غير موجود' },
                { status: 404 }
            );
        }

        // Get ALL flats on this floor (including deleted) to avoid reference conflicts
        const allFlats = await prisma.flat.findMany({
            where: {
                buildingId,
                floorNum,
            },
        });

        // Only count active flats for the 4-flat limit
        const activeFlats = allFlats.filter(f => !f.deletedAt);
        const existingCount = activeFlats.length;
        const totalAfterCreation = existingCount + count;

        if (totalAfterCreation > 4) {
            return NextResponse.json(
                { error: `لا يمكن إضافة ${count} شقة/شقق. الطابق يحتوي على ${existingCount} شقة/شقق ويمكن إضافة ${4 - existingCount} شقة/شقق فقط (الحد الأقصى 4 شقق لكل طابق).` },
                { status: 400 }
            );
        }

        // Get positions from ALL flats (including deleted) to avoid reference conflicts
        const existingPositions = allFlats
            .map(f => f.flatPosition)
            .filter((p): p is number => p !== null)
            .sort((a, b) => a - b);

        const nextPositions: number[] = [];
        for (let pos = 1; pos <= 4; pos++) {
            if (!existingPositions.includes(pos)) {
                nextPositions.push(pos);
                if (nextPositions.length === count) break;
            }
        }

        // Generate reference numbers for all flats
        const flatReferences = await Promise.all(
            Array.from({ length: count }, async (_, index) => {
                const position = nextPositions[index]; // Use the calculated next available position
                const referenceNum = await generateFlatReference(buildingId, floorNum, position);

                return {
                    referenceNum,
                    buildingId,
                    floorNum,
                    flatType: getFlatType(count, position),
                    flatPosition: position,
                    propertyType,
                    status: 'AVAILABLE' as const,
                };
            })
        );

        // Check for reference number conflicts (ignore soft-deleted)
        const existingRefs = await prisma.flat.findMany({
            where: {
                referenceNum: {
                    in: flatReferences.map(f => f.referenceNum),
                },
                OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }], // Only check active flats
            },
        });

        if (existingRefs.length > 0) {
            return NextResponse.json(
                { error: 'رقم مرجعي مكرر. يرجى المحاولة مرة أخرى.' },
                { status: 400 }
            );
        }

        // Create all flats in a transaction
        const flats = await prisma.$transaction(
            flatReferences.map(flatData =>
                prisma.flat.create({ data: flatData })
            )
        );

        return NextResponse.json({
            flats,
            message: `تم إنشاء ${count} شقة/شقق بنجاح في الطابق ${floorNum}`,
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('[BULK_CREATE_ERROR]', error);
        return NextResponse.json(
            {
                error: 'فشل في إنشاء الشقق',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
