const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function testQuery() {
    console.log('Testing MongoDB query syntax...\n');

    try {
        // Test the OR syntax for deletedAt
        const result = await prisma.flat.findMany({
            where: {
                OR: [
                    { deletedAt: { isSet: false } },
                    { deletedAt: null }
                ]
            },
            take: 5,
        });

        console.log(`✅ Query successful! Found ${result.length} active flats`);
        if (result.length > 0) {
            console.log('\nSample flat:');
            console.log(`   - ${result[0].referenceNum} (deletedAt: ${result[0].deletedAt})`);
        }

    } catch (error) {
        console.error('❌ Query failed:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testQuery();
