const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Complete migration with two-phase approach to avoid conflicts
 */
async function completeMigration() {
    console.log('🚀 Starting two-phase migration...\n');

    try {
        // PHASE 1: Add temp prefix to all references to avoid conflicts
        console.log('📝 Phase 1: Adding temp prefix...');
        const allFlats = await prisma.flat.findMany({
            where: { deletedAt: undefined },
        });

        for (const flat of allFlats) {
            await prisma.flat.update({
                where: { id: flat.id },
                data: { referenceNum: `TEMP_${flat.id}` },
            });
        }
        console.log(`   ✓ Updated ${allFlats.length} flats with temp references\n`);

        // PHASE 2: Process floor-by-floor with proper references
        console.log('📝 Phase 2: Assigning new references...');
        const buildings = await prisma.building.findMany({
            include: {
                flats: {
                    where: { deletedAt: undefined },
                    orderBy: [
                        { floorNum: 'asc' },
                        { flatType: 'asc' },
                    ],
                },
            },
        });

        function getBuildingCode(buildingName, createdAt) {
            const match = buildingName.match(/(\d+)/);
            return match ? `B${match[1]}` : `B${createdAt.getTime()}`;
        }

        let totalUpdated = 0;

        for (const building of buildings) {
            if (building.flats.length === 0) continue;

            const buildingCode = getBuildingCode(building.name, building.createdAt);
            console.log(`\n📦 ${building.name} (${buildingCode})`);

            // Group by floor
            const floorMap = {};
            building.flats.forEach(flat => {
                if (!floorMap[flat.floorNum]) floorMap[flat.floorNum] = [];
                floorMap[flat.floorNum].push(flat);
            });

            // Process each floor
            for (const [floorNum, flats] of Object.entries(floorMap)) {
                let positionCounter = 1;

                for (const flat of flats) {
                    const position = positionCounter++;
                    const newRef = `${buildingCode}-F${floorNum}-${position}`;

                    await prisma.flat.update({
                        where: { id: flat.id },
                        data: {
                            flatPosition: position,
                            referenceNum: newRef,
                        },
                    });
                    console.log(`   ✓ Floor ${floorNum}: ${newRef}`);
                    totalUpdated++;
                }
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Total flats updated: ${totalUpdated}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

completeMigration();
