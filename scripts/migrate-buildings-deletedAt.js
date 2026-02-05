// Migration script to add deletedAt: null to all buildings that don't have it
import prisma from '../lib/prisma.js';

async function migrateBuildingsDeletedAt() {
    try {
        console.log('Starting migration: Adding deletedAt field to buildings...');
        
        // Get all buildings
        const allBuildings = await prisma.building.findMany({
            select: { id: true, name: true, deletedAt: true }
        });
        
        console.log(`Found ${allBuildings.length} total buildings`);
        
        // Filter buildings where deletedAt is undefined (field doesn't exist)
        const buildingsToUpdate = allBuildings.filter(b => b.deletedAt === undefined);
        
        console.log(`Buildings needing migration: ${buildingsToUpdate.length}`);
        
        if (buildingsToUpdate.length === 0) {
            console.log('No buildings need migration. All done!');
            return;
        }
        
        // Update each building to set deletedAt: null
        let updated = 0;
        for (const building of buildingsToUpdate) {
            await prisma.building.update({
                where: { id: building.id },
                data: { deletedAt: null }
            });
            updated++;
            console.log(`✓ Updated ${building.name} (${updated}/${buildingsToUpdate.length})`);
        }
        
        console.log(`\n✅ Migration complete! Updated ${updated} buildings.`);
        console.log('All buildings now have deletedAt field set to null or a Date.');
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateBuildingsDeletedAt();
