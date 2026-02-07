import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateFlatReference } from '@/lib/reference-generator';
import { z } from 'zod';

const updateSchema = z.object({
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD']).optional(),
    propertyType: z.enum(['APARTMENT', 'COMMERCIAL_STORE']).optional(),
});

// GET /api/flats/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const flat = await prisma.flat.findUnique({
            where: { id },
            include: {
                purchase: {
                    where: {},
                    include: {
                        client: true,
                        payments: {
                            where: {},
                        },
                    },
                },
                parentFlat: true,
                childFlats: {
                    where: {},
                },
            },
        });

        if (!flat) {
            return NextResponse.json({ error: 'الشقة غير موجودة' }, { status: 404 });
        }

        return NextResponse.json(flat);
    } catch (error) {
        console.error('Error fetching flat:', error);
        return NextResponse.json(
            { error: 'فشل في جلب بيانات الشقة' },
            { status: 500 }
        );
    }
}

// PATCH /api/flats/[id] - Update flat
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateSchema.parse(body);

        const flat = await prisma.flat.update({
            where: { id },
            data: validated,
        });

        return NextResponse.json(flat);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error('Error updating flat:', error);
        return NextResponse.json(
            { error: 'فشل في تحديث الشقة' },
            { status: 500 }
        );
    }
}

// DELETE /api/flats/[id] - Soft delete (only if not in active purchase)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const flat = await prisma.flat.findUnique({
            where: { id },
            include: {
                purchase: {
                    where: {},
                },
            },
        });

        if (!flat) {
            return NextResponse.json({ error: 'الشقة غير موجودة' }, { status: 404 });
        }

        if (flat.purchase) {
            return NextResponse.json(
                { error: 'لا يمكن حذف شقة في عملية شراء نشطة' },
                { status: 400 }
            );
        }

        await prisma.flat.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting flat:', error);
        return NextResponse.json(
            { error: 'فشل في حذف الشقة' },
            { status: 500 }
        );
    }
}
