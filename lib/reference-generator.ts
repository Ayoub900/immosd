/**
 * Generate unique reference numbers for flats
 * Format: B{building}-F{floor}-{sequence}
 * Examples: B1-F1-001, B1-F2-002R, B2-F1-001
 */

import prisma from './prisma';

export async function generateFlatReference(
    buildingId: string,
    floorNum: number,
    flatType: 'FULL' | 'HALF_RIGHT' | 'HALF_LEFT',
    parentReferenceNum?: string
): Promise<string> {
    if (flatType !== 'FULL' && parentReferenceNum) {
        // For split flats, use parent reference with R or L suffix
        const suffix = flatType === 'HALF_RIGHT' ? 'R' : 'L';
        return `${parentReferenceNum}${suffix}`;
    }

    // Get building to find its sequence number
    const building = await prisma.building.findUnique({
        where: { id: buildingId },
        select: { createdAt: true },
    });

    if (!building) {
        throw new Error('Building not found');
    }

    // Count buildings created before this one to get building sequence
    const buildingSeq =
        (await prisma.building.count({
            where: {
                createdAt: { lte: building.createdAt },
            },
        })) || 1;

    // Get existing flats on this floor in this building
    const floorFlats = await prisma.flat.findMany({
        where: {
            buildingId,
            floorNum,
            flatType: 'FULL',
            parentFlatId: null,
        },
        orderBy: {
            referenceNum: 'desc',
        },
        take: 1,
    });

    let sequence = 1;
    if (floorFlats.length > 0) {
        const lastRef = floorFlats[0].referenceNum;
        // Extract sequence from B1-F2-003 format
        const match = lastRef.match(/B\d+-F\d+-(\d+)/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }

    return `B${buildingSeq}-F${floorNum}-${sequence.toString().padStart(3, '0')}`;
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
