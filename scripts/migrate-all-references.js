const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Migrate all existing flat references to new format
 * Old: B17-F2-001L, 121ا-F4-1, etc.
 * New: B6-F1-2 (based on building sequence by creation date)
 */
async function migrateReferences() {
    console.log('🚀 Starting reference migration to new format...\n');

    try {
        // Get all buildings ordered by creation date
        const buildings = await prisma.building.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                flats: {
                    where: { deletedAt: undefined },
                    orderBy: [
                        { floorNum: 'asc' },
                        { flatType: 'asc' }, // FULL, HALF_LEFT, HALF_RIGHT
                    ],
                },
            },
        });

        console.log(`📊 Found ${buildings.length} buildings\n`);

        // PHASE 1: Assign temporary references to avoid conflicts
        console.log('📝 Phase 1: Assigning temporary references...');
        let flatCount = 0;
        for (const building of buildings) {
            for (const flat of building.flats) {
                await prisma.flat.update({
                    where: { id: flat.id },
                    data: { referenceNum: `TEMP_${flat.id}` },
                });
                flatCount++;
            }
        }
        console.log(`   ✓ Updated ${flatCount} flats with temp references\n`);

        // PHASE 2: Assign final references with correct format
        console.log('📝 Phase 2: Assigning final references...\n');
        
        let buildingSeq = 1;
        let totalUpdated = 0;

        for (const building of buildings) {
            if (building.flats.length === 0) {
                buildingSeq++;
                continue;
            }

            console.log(`📦 B${buildingSeq}: ${building.name} (${building.flats.length} flats)`);

            // Group flats by floor
            const floorMap = {};
            building.flats.forEach(flat => {
                if (!floorMap[flat.floorNum]) floorMap[flat.floorNum] = [];
                floorMap[flat.floorNum].push(flat);
            });

            // Process each floor
            for (const [floorNum, flats] of Object.entries(floorMap)) {
                let position = 1;

                for (const flat of flats) {
                    const newRef = `B${buildingSeq}-F${floorNum}-${position}`;

                    await prisma.flat.update({
                        where: { id: flat.id },
                        data: {
                            referenceNum: newRef,
                            flatPosition: position,
                        },
                    });

                    console.log(`   ✓ ${newRef}`);
                    position++;
                    totalUpdated++;
                }
            }

            buildingSeq++;
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Summary:`);
        console.log(`   - Buildings processed: ${buildings.length}`);
        console.log(`   - Flats updated: ${totalUpdated}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateReferences();
