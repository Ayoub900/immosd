/**
 * Creates an index on payments.createdAt to fix MongoDB error 292
 * (in-memory sort exceeding 32MB) on the paginated payments list.
 *
 * createIndexes is idempotent: re-running with the same spec is a no-op.
 * It only builds an index — no documents are read, written, or deleted.
 *
 * Run with: npx tsx scripts/add-payment-index.ts
 */
import prisma from '../lib/prisma';

async function main() {
    console.log('Creating index { createdAt: -1 } on "payments"...');

    const result = await prisma.$runCommandRaw({
        createIndexes: 'payments',
        indexes: [
            {
                key: { createdAt: -1 },
                name: 'createdAt_-1',
            },
        ],
    });

    console.log('Done:', JSON.stringify(result, null, 2));

    // Show the resulting indexes so we can confirm.
    const indexes = await prisma.$runCommandRaw({ listIndexes: 'payments' });
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
}

main()
    .catch((e) => {
        console.error('Failed to create index:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
