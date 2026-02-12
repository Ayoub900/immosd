const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Update old reference numbers to new format
 * Old: B1-F3-001, B1-F3-001R, B1-F3-001L
 * New: B1-F3-1, B1-F3-2
 */
async function updateReferenceNumbers() {
    console.log('🔄 Updating reference numbers to new format...\n');

    try {
        // Get all flats with positions
        const flats = await prisma.flat.findMany({
            where: {
                deletedAt: undefined,
                flatPosition: {
                    not: null,
                },
            },
            include: {
                building: {
                    select: {
                        name: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: [
                { buildingId: 'asc' },
                { floorNum: 'asc' },
                { flatPosition: 'asc' },
            ],
        });

        console.log(`📊 Found ${flats.length} flats to process\n`);

        // Helper: Get building code from building name
        function getBuildingCode(buildingName, createdAt) {
            const match = buildingName.match(/(\d+)/);
            return match ? `B${match[1]}` : `B${createdAt.getTime()}`;
        }

        let updated = 0;
        let skipped = 0;

        for (const flat of flats) {
            const buildingCode = getBuildingCode(flat.building.name, flat.building.createdAt);
            const newRef = `${buildingCode}-F${flat.floorNum}-${flat.flatPosition}`;

            // Only update if different
            if (flat.referenceNum !== newRef) {
                await prisma.flat.update({
                    where: { id: flat.id },
                    data: { referenceNum: newRef },
                });
                console.log(`   ✓ Updated: ${flat.referenceNum} → ${newRef}`);
                updated++;
            } else {
                skipped++;
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total flats: ${flats.length}`);
        console.log(`   - Updated: ${updated}`);
        console.log(`   - Already correct: ${skipped}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateReferenceNumbers();
