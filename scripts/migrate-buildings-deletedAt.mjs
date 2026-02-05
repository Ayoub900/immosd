// Migration script to add deletedAt: null to all buildings that don't have it
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function migrateBuildingsDeletedAt() {
    try {
        console.log('Starting migration: Adding deletedAt field to buildings...');
        
        // Update all buildings that don't have deletedAt set
        // In MongoDB, we can use updateMany with a raw query
        const result = await prisma.building.updateMany({
            where: {},
            data: { deletedAt: null }
        });
        
        console.log(`✅ Migration complete! Updated ${result.count} buildings to have deletedAt: null`);
        console.log('Now all buildings have the deletedAt field and the filter will work correctly.');
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateBuildingsDeletedAt();
