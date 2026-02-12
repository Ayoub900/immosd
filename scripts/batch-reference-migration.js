const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Batch migration using Prisma transactions
 * Keep old format, just change L/R/001 to position numbers
 */
async function batchMigration() {
    console.log('🚀 Starting batch migration with transactions...\n');

    try {
        // Get all buildings with flats
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

        // Build all updates first
        const updates = [];

        for (const building of buildings) {
            if (building.flats.length === 0) continue;

            // Group by floor
            const floorMap = {};
            building.flats.forEach(flat => {
                if (!floorMap[flat.floorNum]) floorMap[flat.floorNum] = [];
                floorMap[flat.floorNum].push(flat);
            });

            // Prepare updates for each floor
            for (const [floorNum, flats] of Object.entries(floorMap)) {
                let positionCounter = 1;

                for (const flat of flats) {
                    const position = positionCounter++;
                    
                    // Extract building code from existing reference
                    let buildingCode, floorPart;
                    
                    if (flat.referenceNum.startsWith('TEMP_')) {
                        // Get from another flat in same building or create
                        const otherFlat = building.flats.find(f => 
                            !f.referenceNum.startsWith('TEMP_') && f.id !== flat.id
                        );
                        
                        if (otherFlat) {
                            const parts = otherFlat.referenceNum.split('-');
                            buildingCode = parts[0];
                        } else {
                            const match = building.name.match(/(\d+)/);
                            buildingCode = match ? `B${match[1]}` : 'B'+ building.name.substring(0, 3);
                        }
                        floorPart = `F${floorNum}`;
                    } else {
                        const parts = flat.referenceNum.split('-');
                        buildingCode = parts[0] || 'B1';
                        floorPart = parts[1] || `F${floorNum}`;
                    }

                    const newRef = `${buildingCode}-${floorPart}-${position}`;

                    updates.push({
                        id: flat.id,
                        oldRef: flat.referenceNum,
                        newRef: newRef,
                        position: position,
                        buildingName: building.name,
                    });
                }
            }
        }

        console.log(`📊 Prepared ${updates.length} updates\n`);

        // Execute all updates in a single transaction
        await prisma.$transaction(
            updates.map(u => 
                prisma.flat.update({
                    where: { id: u.id },
                    data: {
                        referenceNum: u.newRef,
                        flatPosition: u.position,
                    },
                })
            )
        );

        console.log(`✅ Migration complete!`);
        console.log(`\nSample updates:`);
        updates.slice(0, 10).forEach(u => {
            console.log(`   ✓ ${u.oldRef} → ${u.newRef} (${u.buildingName})`);
        });
        if (updates.length > 10) {
            console.log(`   ... and ${updates.length - 10} more`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nError details:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

batchMigration();
