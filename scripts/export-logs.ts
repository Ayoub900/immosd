import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function exportLogs(format: 'json' | 'csv' = 'json') {
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${timestamp}.${format}`;
    const filepath = path.join(process.cwd(), filename);

    if (format === 'json') {
        fs.writeFileSync(filepath, JSON.stringify(logs, null, 2));
    } else {
        // CSV format
        const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Entity ID', 'IP Address', 'User Agent'];
        const rows = logs.map((log: any) => [
            log.createdAt.toISOString(),
            log.userName,
            log.action,
            log.entityType,
            log.entityName || '',
            log.entityId,
            log.ipAddress || '',
            log.userAgent || '',
        ]);

        const csv = [headers, ...rows].map((row: any) =>
            row.map((cell: any) => `"${cell}"`).join(',')
        ).join('\n');

        fs.writeFileSync(filepath, csv);
    }

    console.log(`✅ Exported ${logs.length} logs to ${filename}`);
    await prisma.$disconnect();
}

const format = process.argv[2] === 'csv' ? 'csv' : 'json';
exportLogs(format).catch(console.error);
