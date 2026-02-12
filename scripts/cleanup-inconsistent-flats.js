const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Cleanup script: Remove FULL flats that coexist with split flats on same floor
 * 
 * Logic:
 * 1. Find all floors that have both FULL and HALF flats
 * 2. Soft-delete the FULL flats (set deletedAt) since they're redundant
 * 3. Keep the split flats (HALF_LEFT, HALF_RIGHT)
 */
async function cleanupInconsistentFlats() {
    console.log('🧹 Starting cleanup: Removing inconsistent FULL flats...\n');

    try {
        // Get all flats grouped by building and floor
        const allFlats = await prisma.flat.findMany({
            where: {
                deletedAt: undefined, // Only active flats
            },
            select: {
                id: true,
                referenceNum: true,
                buildingId: true,
                floorNum: true,
                flatType: true,
                status: true,
            },
            orderBy: [
                { buildingId: 'asc' },
                { floorNum: 'asc' },
            ],
        });

        // Group by building + floor
        const floorGroups = {};
        allFlats.forEach(flat => {
            const key = `${flat.buildingId}-${flat.floorNum}`;
            if (!floorGroups[key]) {
                floorGroups[key] = [];
            }
            floorGroups[key].push(flat);
        });

        console.log(`📊 Total floors with flats: ${Object.keys(floorGroups).length}\n`);

        // Find inconsistent floors
        const inconsistentFloors = [];
        const flatsToDelete = [];

        Object.entries(floorGroups).forEach(([key, flats]) => {
            const hasFull = flats.some(f => f.flatType === 'FULL');
            const hasHalves = flats.some(f => f.flatType === 'HALF_LEFT' || f.flatType === 'HALF_RIGHT');

            // If floor has BOTH full and half flats, it's inconsistent
            if (hasFull && hasHalves) {
                inconsistentFloors.push(key);
                
                // Mark FULL flats for deletion
                const fullFlats = flats.filter(f => f.flatType === 'FULL');
                fullFlats.forEach(flat => {
                    flatsToDelete.push({
                        id: flat.id,
                        ref: flat.referenceNum,
                        floor: key,
                        status: flat.status,
                    });
                });
            }
        });

        console.log(`⚠️  Found ${inconsistentFloors.length} inconsistent floors\n`);

        if (flatsToDelete.length === 0) {
            console.log('✅ No inconsistent flats found. Data is clean!');
            return;
        }

        console.log('🗑️  Flats to be soft-deleted:\n');
        flatsToDelete.forEach(flat => {
            console.log(`   - ${flat.ref} (Floor: ${flat.floor}, Status: ${flat.status})`);
        });

        console.log(`\n⚠️  WARNING: About to soft-delete ${flatsToDelete.length} FULL flats`);
        console.log('⚠️  This is irreversible. Press Ctrl+C to cancel.\n');

        // Give user 3 seconds to cancel
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if any flats to delete have purchases
        const flatsWithPurchases = await prisma.flat.findMany({
            where: {
                id: {
                    in: flatsToDelete.map(f => f.id),
                },
                purchase: {
                    isNot: null,
                },
            },
            include: {
                purchase: {
                    include: {
                        client: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });

        if (flatsWithPurchases.length > 0) {
            console.log('\n❌ ERROR: Cannot delete flats with active purchases:');
            flatsWithPurchases.forEach(flat => {
                console.log(`   - ${flat.referenceNum}: Purchased by ${flat.purchase.client.fullName}`);
            });
            console.log('\nPlease handle these manually first.');
            return;
        }

        // Perform soft delete
        let deleted = 0;
        for (const flat of flatsToDelete) {
            await prisma.flat.update({
                where: { id: flat.id },
                data: { deletedAt: new Date() },
            });
            deleted++;
            console.log(`   ✓ Deleted: ${flat.ref}`);
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`📊 Summary:`);
        console.log(`   - Inconsistent floors found: ${inconsistentFloors.length}`);
        console.log(`   - FULL flats soft-deleted: ${deleted}`);
        console.log(`   - Active flats remaining: ${allFlats.length - deleted}`);

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanupInconsistentFlats();
