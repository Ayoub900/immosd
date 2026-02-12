const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkProblematicFlats() {
    console.log('🔍 Checking soft-deleted flats with purchases...\n');

    try {
        const flats = await prisma.flat.findMany({
            where: {
                deletedAt: { not: null },
            },
            include: {
                purchase: {
                    include: {
                        client: true,
                        payments: true,
                    },
                },
            },
        });

        const withPurchases = flats.filter(f => f.purchase);

        console.log(`📊 Soft-deleted flats with purchases: ${withPurchases.length}\n`);

        if (withPurchases.length === 0) {
            console.log('✅ No problematic flats found!');
            return;
        }

        withPurchases.forEach(f => {
            console.log(`\n📋 ${f.referenceNum} (${f.status}):`);
            console.log(`   Client: ${f.purchase.client.fullName}`);
            console.log(`   Agreed Price: ${f.purchase.agreedPrice} DH`);
            console.log(`   Total Paid: ${f.purchase.totalPaid} DH`);
            console.log(`   Remaining: ${f.purchase.remainingAmount} DH`);
            console.log(`   Payments: ${f.purchase.payments.length}`);
            console.log(`   Flat Status: ${f.status}`);
            console.log(`   Deleted At: ${f.deletedAt}`);
        });

        console.log(`\n⚠️  These flats cannot be deleted because they have active purchases.`);
        console.log(`💡 Options:`);
        console.log(`   1. Keep them as soft-deleted (current state)`);
        console.log(`   2. Restore them (set deletedAt = null)`);
        console.log(`   3. Transfer purchase to a different flat (risky)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProblematicFlats();
