import prisma from '../lib/prisma';

interface FilterOptions {
    limit?: number;
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}

async function viewLogs(options: FilterOptions = {}) {
    const {
        limit = 50,
        entityType,
        action,
        userId,
        startDate,
        endDate,
    } = options;

    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    console.log(`\n📋 Found ${logs.length} audit log entries:\n`);
    console.log('─'.repeat(120));

    logs.forEach((log: any) => {
        const timestamp = log.createdAt.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        console.log(`🕒 ${timestamp} | 👤 ${log.userName}`);
        console.log(`   📌 ${log.action} ${log.entityType.toUpperCase()}: ${log.entityName || log.entityId}`);

        if (log.changes) {
            console.log(`   📝 Changes:`);
            console.log(JSON.stringify(log.changes, null, 4));
        }

        console.log(`   🌐 IP: ${log.ipAddress || 'N/A'} | 🖥️  ${log.userAgent?.substring(0, 60)}...`);
        console.log('─'.repeat(120));
    });

    console.log(`\nShowing ${logs.length} of total logs`);

    await prisma.$disconnect();
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: FilterOptions = {};

for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    if (!key || !value) continue;

    if (key === 'limit') options.limit = parseInt(value);
    if (key === 'type') options.entityType = value;
    if (key === 'action') options.action = value.toUpperCase();
    if (key === 'user') options.userId = value;
    if (key === 'since') options.startDate = new Date(value);
    if (key === 'until') options.endDate = new Date(value);
}

viewLogs(options).catch(console.error);
