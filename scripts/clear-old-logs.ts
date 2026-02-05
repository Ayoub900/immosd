import prisma from '../lib/prisma';

async function clearOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    console.log(`🗑️  Deleted ${result.count} audit logs older than ${daysOld} days (before ${cutoffDate.toISOString().split('T')[0]})`);
    await prisma.$disconnect();
}

const days = parseInt(process.argv[2]) || 90;
clearOldLogs(days).catch(console.error);
