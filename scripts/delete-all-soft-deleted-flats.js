const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Hard delete ALL soft-deleted flats
 * Breaks child relationships first, then deletes everything
 */
async function deleteAllSoftDeletedFlats() {
    console.log('🗑️  Hard deleting ALL soft-deleted flats...\n');

    try {
        // Get all soft-deleted flats
        const deletedFlats = await prisma.flat.findMany({
            where: {
                deletedAt: { not: null },
            },
            include: {
                purchase: true,
                expenses: true,
            },
        });

        console.log(`📊 Total soft-deleted flats: ${deletedFlats.length}`);

        // Check for blockers
        const withPurchases = deletedFlats.filter(f => f.purchase);
        const withExpenses = deletedFlats.filter(f => f.expenses.length > 0);

        if (withPurchases.length > 0) {
            console.log(`\n❌ Cannot delete ${withPurchases.length} flats with active purchases:`);
            withPurchases.forEach(f => {
                console.log(`   - ${f.referenceNum}`);
            });
            return;
        }

        if (withExpenses.length > 0) {
            console.log(`\n⚠️  Warning: ${withExpenses.length} flats have expenses.`);
        }

        console.log(`\n✅ All ${deletedFlats.length} flats are safe to delete.\n`);

        // Show what will be deleted
        console.log('Flats to be permanently deleted:');
        deletedFlats.slice(0, 10).forEach(f => {
            console.log(`   - ${f.referenceNum}`);
        });
        if (deletedFlats.length > 10) {
            console.log(`   ... and ${deletedFlats.length - 10} more`);
        }

        console.log(`\n⚠️  This will PERMANENTLY delete ${deletedFlats.length} flats.`);
        console.log('⏳ Starting in 3 seconds... Press Ctrl+C to cancel.\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // STEP 1: Break all parent/child relationships
        console.log('📝 Step 1: Breaking parent/child relationships...');
        await prisma.flat.updateMany({
            where: {
                parentFlatId: { not: null },
                deletedAt: { not: null },
            },
            data: {
                parentFlatId: null,
            },
        });
        console.log('   ✓ Relationships cleared\n');

        // STEP 2: Hard delete all soft-deleted flats
        console.log('📝 Step 2: Deleting flats...');
        const result = await prisma.flat.deleteMany({
            where: {
                deletedAt: { not: null },
            },
        });

        console.log(`\n✅ Successfully deleted ${result.count} flats!`);

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllSoftDeletedFlats();
