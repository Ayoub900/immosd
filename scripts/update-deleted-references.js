const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Update existing soft-deleted flats to append timestamp to their reference numbers
 * This frees up the references for reuse on new flats
 */
async function updateDeletedReferences() {
    console.log('🔧 Updating soft-deleted flat references...\n');

    try {
        // Get all soft-deleted flats
        const deletedFlats = await prisma.flat.findMany({
            where: {
                OR: [
                    { deletedAt: { isSet: true } },
                    { deletedAt: { not: null } }
                ]
            },
        });

        console.log(`📊 Found ${deletedFlats.length} soft-deleted flats\n`);

        if (deletedFlats.length === 0) {
            console.log('✅ No flats to update!');
            return;
        }

        // Filter only those that haven't been renamed yet
        const needsUpdate = deletedFlats.filter(f => !f.referenceNum.includes('_DELETED_'));

        console.log(`🔄 Need to update: ${needsUpdate.length} flats\n`);

        if (needsUpdate.length === 0) {
            console.log('✅ All deleted flats already have modified references!');
            return;
        }

        // Update each one
        let updated = 0;
        for (const flat of needsUpdate) {
            const timestamp = flat.deletedAt ? flat.deletedAt.getTime() : Date.now();
            const newRef = `${flat.referenceNum}_DELETED_${timestamp}`;

            await prisma.flat.update({
                where: { id: flat.id },
                data: { referenceNum: newRef },
            });

            console.log(`   ✓ ${flat.referenceNum} → ${newRef}`);
            updated++;
        }

        console.log(`\n✅ Updated ${updated} reference numbers!`);
        console.log('💡 These references are now available for reuse on new flats.');

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateDeletedReferences();
