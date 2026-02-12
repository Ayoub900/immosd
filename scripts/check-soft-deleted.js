const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkSoftDeletedFlats() {
    console.log('🔍 Checking soft-deleted flats...\n');

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

        console.log(`📊 Total soft-deleted flats: ${deletedFlats.length}\n`);

        if (deletedFlats.length === 0) {
            console.log('✅ No soft-deleted flats found.');
            return;
        }

        // Check for relationships
        const withPurchases = deletedFlats.filter(f => f.purchase);
        const withExpenses = deletedFlats.filter(f => f.expenses.length > 0);
        const withChildren = deletedFlats.filter(f => f.childFlats.length > 0);

        console.log('🔗 Relationships found:');
        console.log(`   - Flats with purchases: ${withPurchases.length}`);
        console.log(`   - Flats with expenses: ${withExpenses.length}`);
        console.log(`   - Flats with child flats: ${withChildren.length}\n`);

        if (withPurchases.length > 0) {
            console.log('⚠️  Flats with purchases (CANNOT delete):');
            withPurchases.forEach(f => {
                console.log(`   - ${f.referenceNum} (Purchase: ${f.purchase.id})`);
            });
            console.log();
        }

        const safeToDelete = deletedFlats.filter(
            f => !f.purchase && f.expenses.length === 0 && f.childFlats.length === 0
        );

        console.log(`✅ Safe to hard delete: ${safeToDelete.length} flats`);
        if (safeToDelete.length > 0) {
            console.log('\nList of flats safe to delete:');
            safeToDelete.forEach(f => {
                console.log(`   - ${f.referenceNum} (Floor ${f.floorNum})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSoftDeletedFlats();
