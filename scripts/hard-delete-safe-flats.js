const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Hard delete soft-deleted flats that have no relationships
 * This frees up space for creating new flats
 */
async function hardDeleteSafeFlats() {
    console.log('🗑️  Hard deleting safe soft-deleted flats...\n');

    try {
        // Get all soft-deleted flats
        const deletedFlats = await prisma.flat.findMany({
            where: {
                deletedAt: { not: null },
            },
            include: {
                purchase: true,
                expenses: true,
                childFlats: true,
            },
        });

        console.log(`📊 Total soft-deleted flats: ${deletedFlats.length}`);

        // Filter to only safe ones (no relationships)
        const safeToDelete = deletedFlats.filter(
            f => !f.purchase && f.expenses.length === 0 && f.childFlats.length === 0
        );

        console.log(`✅ Safe to hard delete: ${safeToDelete.length} flats\n`);

        if (safeToDelete.length === 0) {
            console.log('No flats to delete.');
            return;
        }

        // Show what will be deleted
        console.log('Flats to be permanently deleted:');
        safeToDelete.forEach(f => {
            console.log(`   - ${f.referenceNum} (Floor ${f.floorNum})`);
        });

        console.log(`\n⚠️  This will PERMANENTLY delete ${safeToDelete.length} flats.`);
        console.log('⏳ Starting in 3 seconds... Press Ctrl+C to cancel.\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Hard delete
        let deleted = 0;
        for (const flat of safeToDelete) {
            await prisma.flat.delete({
                where: { id: flat.id },
            });
            deleted++;
        }

        console.log(`\n✅ Successfully deleted ${deleted} flats!`);

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

hardDeleteSafeFlats();
