// Script to mark specific building as deleted
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function markBuildingAsDeleted() {
    try {
        const buildingName = 'المبنى الأول';
        
        console.log(`Looking for building: ${buildingName}`);
        
        // Find the building
        const building = await prisma.building.findFirst({
            where: { name: buildingName }
        });
        
        if (!building) {
            console.log(`❌ Building "${buildingName}" not found`);
            return;
        }
        
        console.log(`Found building: ${building.name} (ID: ${building.id})`);
        
        // Mark as deleted
        await prisma.building.update({
            where: { id: building.id },
            data: { deletedAt: new Date() }
        });
        
        console.log(`✅ Successfully marked "${buildingName}" as deleted`);
        
        // Also mark all its flats as deleted
        const result = await prisma.flat.updateMany({
            where: { buildingId: building.id },
            data: { deletedAt: new Date() }
        });
        
        console.log(`✅ Also marked ${result.count} flats as deleted`);
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

markBuildingAsDeleted();
