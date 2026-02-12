/**
 * Generate unique reference numbers for flats
 * Format: B{building}-F{floor}-{sequence}
 * Examples: B1-F1-001, B1-F2-002R, B2-F1-001
 */

import prisma from './prisma';

export async function generateFlatReference(
    buildingId: string,
    floorNum: number,
    position: number
): Promise<string> {
    // Get building details
    const building = await prisma.building.findUnique({
        where: { id: buildingId },
        select: {
            createdAt: true,
        },
    });

    if (!building) {
        throw new Error('Building not found');
    }

    // Calculate building sequence based on creation order (B1, B2, B3, etc.)
    const buildingSeq = await prisma.building.count({
        where: {
            createdAt: { lte: building.createdAt },
        },
    }) || 1;

    // Format: B6-F1-2, B17-F3-4, etc.
    return `B${buildingSeq}-F${floorNum}-${position}`;
}

/**
 * Generate unique receipt number
 * Format: RCP-YYYY-NNN
 */
export async function generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const yearStr = year.toString();

    const lastReceipt = await prisma.payment.findFirst({
        where: {
            receiptNum: {
                startsWith: `RCP-${yearStr}`,
            },
        },
        orderBy: {
            receiptNum: 'desc',
        },
    });

    let sequence = 1;
    if (lastReceipt) {
        const match = lastReceipt.receiptNum.match(/RCP-\d+-(\d+)/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }

    return `RCP-${yearStr}-${sequence.toString().padStart(3, '0')}`;
}
