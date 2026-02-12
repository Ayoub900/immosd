const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Simple migration: Keep old format, just change L/R/001 to position numbers
 * Example: B1-F1-001L → B1-F1-1, B1-F1-001R → B1-F1-2
 */
async function simpleMigration() {
    console.log('🚀 Starting simple suffix migration...\n');

    try {
        // Get all buildings with flats
        const buildings = await prisma.building.findMany({
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

        let totalUpdated = 0;

        for (const building of buildings) {
            if (building.flats.length === 0) continue;

            console.log(`\n📦 ${building.name}`);

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
                    
                    // Extract building code and floor from existing reference
                    // Examples: B1-F1-001L, B17-F2-001, TEMP_xxx
                    let buildingCode, floorPart;
                    
                    if (flat.referenceNum.startsWith('TEMP_')) {
                        // Need to reconstruct - find from other flats or use building data
                        // For now, skip or use a default pattern
                        const match = building.name.match(/(\d+)/);
                        buildingCode = match ? `B${match[1]}` : `B${building.id}`;
                        floorPart = `F${floorNum}`;
                    } else {
                        const parts = flat.referenceNum.split('-');
                        if (parts.length >= 2) {
                            buildingCode = parts[0]; // B1, B17, etc.
                            floorPart = parts[1];    // F1, F2, etc.
                        } else {
                            // Fallback
                            buildingCode = `B${building.id}`;
                            floorPart = `F${floorNum}`;
                        }
                    }

                    const newRef = `${buildingCode}-${floorPart}-${position}`;

                    if (flat.referenceNum !== newRef) {
                        await prisma.flat.update({
                            where: { id: flat.id },
                            data: {
                                flatPosition: position,
                                referenceNum: newRef,
                            },
                        });
                        console.log(`   ✓ ${flat.referenceNum} → ${newRef}`);
                        totalUpdated++;
                    }
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

simpleMigration();
