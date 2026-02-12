const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkFloorsWithDeletedFlats() {
    console.log('🔍 Checking floors with soft-deleted flats...\n');

    try {
        const buildings = await prisma.building.findMany({
            include: {
                flats: {
                    orderBy: [
                        { floorNum: 'asc' },
                        { flatPosition: 'asc' },
                    ],
                },
            },
        });

        console.log(`📊 Total buildings: ${buildings.length}\n`);

        let totalProblematicFloors = 0;

        for (const building of buildings) {
            // Group by floor
            const floorMap = {};
            building.flats.forEach(flat => {
                if (!floorMap[flat.floorNum]) {
                    floorMap[flat.floorNum] = { active: [], deleted: [] };
                }
                if (flat.deletedAt) {
                    floorMap[flat.floorNum].deleted.push(flat);
                } else {
                    floorMap[flat.floorNum].active.push(flat);
                }
            });

            let buildingHasIssues = false;

            for (const [floorNum, flats] of Object.entries(floorMap)) {
                const activeCount = flats.active.length;
                const deletedCount = flats.deleted.length;

                if (deletedCount > 0 && activeCount < 4) {
                    if (!buildingHasIssues) {
                        console.log(`\n📦 Building: ${building.name}`);
                        buildingHasIssues = true;
                    }
                    console.log(`   Floor ${floorNum}: ${activeCount} active, ${deletedCount} deleted (can add ${4 - activeCount} more)`);
                    if (deletedCount > 0) {
                        console.log(`      Deleted flats:`);
                        flats.deleted.forEach(f => {
                            console.log(`         - ${f.referenceNum} (position: ${f.flatPosition || 'unknown'})`);
                        });
                    }
                    totalProblematicFloors++;
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   - Floors with deleted flats (but room for more): ${totalProblematicFloors}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFloorsWithDeletedFlats();
