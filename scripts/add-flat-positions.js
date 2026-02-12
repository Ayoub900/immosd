const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Safe migration: Add flatPosition to existing flats based on their flatType
 * 
 * Mapping:
 * - FULL -> position 1
 * - HALF_LEFT -> position 1
 * - HALF_RIGHT -> position 2
 */
async function addFlatPositions() {
    console.log('🚀 Starting migration: Adding flatPosition to existing flats...\n');

    try {
        // Get count before migration
        const totalBefore = await prisma.flat.count();
        console.log(`📊 Total flats in database: ${totalBefore}`);

        // Find flats without a flatPosition
    const flatsWithoutPosition = await prisma.flat.findMany({
        where: {
            OR: [
                { flatPosition: null },
                { flatPosition: { equals: null } },
            ],
        },
        select: {
            id: true,
            referenceNum: true,
            flatType: true,
            buildingId: true,
            floorNum: true,
        },
    });      console.log(`🔍 Flats without position: ${flatsWithoutPosition.length}\n`);

        if (flatsWithoutPosition.length === 0) {
            console.log('✅ All flats already have positions. Nothing to migrate.');
            return;
        }

        // Map flatType to position
        const updates = flatsWithoutPosition.map(flat => {
            let position = 1; // Default to position 1
            
            if (flat.flatType === 'FULL' || flat.flatType === 'HALF_LEFT') {
                position = 1;
            } else if (flat.flatType === 'HALF_RIGHT') {
                position = 2;
            }

            return {
                id: flat.id,
                position,
                referenceNum: flat.referenceNum,
            };
        });

        // Update in batches of 50
        const batchSize = 50;
        let updated = 0;

        console.log('📝 Starting updates...');
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            await Promise.all(
                batch.map(({ id, position }) =>
                    prisma.flat.update({
                        where: { id },
                        data: { flatPosition: position },
                    })
                )
            );

            updated += batch.length;
            console.log(`   Updated ${updated}/${updates.length} flats...`);
        }

        // Verify migration
        const totalAfter = await prisma.flat.count();
        const flatsWithPosition = await prisma.flat.count({
            where: {
                flatPosition: { not: null },
            },
        });

        console.log('\n✅ Migration completed!');
        console.log(`📊 Verification:`);
        console.log(`   - Flats before: ${totalBefore}`);
        console.log(`   - Flats after: ${totalAfter}`);
        console.log(`   - Flats with position: ${flatsWithPosition}`);
        console.log(`   - Data loss: ${totalBefore !== totalAfter ? '⚠️ YES - ROLLBACK!' : '✅ NO'}`);

        if (totalBefore !== totalAfter) {
            throw new Error('CRITICAL: Flat count changed during migration!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addFlatPositions();
