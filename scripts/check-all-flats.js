const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Check all flats and their reference numbers
 */
async function checkAllFlats() {
    console.log('🔍 Checking all flats in database...\n');

    try {
        const allFlats = await prisma.flat.findMany({
            include: {
                building: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [
                { buildingId: 'asc' },
                { floorNum: 'asc' },
            ],
        });

        console.log(`📊 Total flats in database: ${allFlats.length}\n`);

        const active = allFlats.filter(f => !f.deletedAt);
        const deleted = allFlats.filter(f => f.deletedAt);

        console.log(`✅ Active flats: ${active.length}`);
        console.log(`🗑️  Deleted flats: ${deleted.length}\n`);

        // Check for old reference format
        const withOldFormat = active.filter(f => 
            f.referenceNum.includes('R') || 
            f.referenceNum.includes('L') ||
            /\d{3}$/.test(f.referenceNum) // Ends with 3 digits like 001
        );

        console.log(`⚠️  Active flats with old reference format: ${withOldFormat.length}`);
        if (withOldFormat.length > 0) {
            console.log('\nFlats needing update:');
            withOldFormat.forEach(f => {
                console.log(`   - ${f.referenceNum} (Building: ${f.building.name}, Floor: ${f.floorNum}, Position: ${f.flatPosition}, Type: ${f.flatType})`);
            });
        }

        // Check flats without positions
        const withoutPosition = active.filter(f => f.flatPosition === null);
        console.log(`\n❌ Active flats without positions: ${withoutPosition.length}`);
        if (withoutPosition.length > 0) {
            console.log('\nFlats without positions:');
            withoutPosition.forEach(f => {
                console.log(`   - ${f.referenceNum} (Type: ${f.flatType})`);
            });
        }

    } catch (error) {
        console.error('\n❌ Check failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkAllFlats();
