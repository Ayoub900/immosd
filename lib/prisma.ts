// lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'; // Adjust path based on your output

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a global singleton instance of PrismaClient
const prisma = new PrismaClient({
    log: ["error"],
})

// In development, store the instance on the global object to prevent hot-reloading issues
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;