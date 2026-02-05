// Test script to check building deletedAt field status
import prisma from './lib/prisma';

async function checkBuildings() {
    console.log('Fetching all buildings including deleted...');

    const allBuildings = await prisma.building.findMany({
        select: {
            id: true,
            name: true,
            deletedAt: true,
        }
    });

    console.log('\nTotal buildings in database:', allBuildings.length);
    console.log('\nBuildings breakdown:');

    const withDeletedAt = allBuildings.filter(b => b.deletedAt !== null && b.deletedAt !== undefined);
    const withoutDeletedAt = allBuildings.filter(b => b.deletedAt === null || b.deletedAt === undefined);

    console.log(`- With deletedAt set (deleted): ${withDeletedAt.length}`);
    withDeletedAt.forEach(b => {
        console.log(`  - ${b.name} (${b.id}) - deleted at: ${b.deletedAt}`);
    });

    console.log(`\n- Without deletedAt (active): ${withoutDeletedAt.length}`);
    withoutDeletedAt.forEach(b => {
        console.log(`  - ${b.name} (${b.id}) - deletedAt: ${b.deletedAt}`);
    });

    // Test the filter
    console.log('\n\nTesting filter: deletedAt: undefined');
    const withUndefinedFilter = await prisma.building.count({
        where: { deletedAt: undefined }
    });
    console.log(`Count with deletedAt: undefined filter: ${withUndefinedFilter}`);

    console.log('\nTesting filter: deletedAt: null');
    const withNullFilter = await prisma.building.count({
        where: { deletedAt: null }
    });
    console.log(`Count with deletedAt: null filter: ${withNullFilter}`);

    console.log('\nTesting filter: no deletedAt filter');
    const withNoFilter = await prisma.building.count({});
    console.log(`Count with no filter: ${withNoFilter}`);

    await prisma.$disconnect();
}

checkBuildings().catch(console.error);
