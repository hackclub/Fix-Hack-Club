import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across requests / hot reloads so we do not
// exhaust Postgres connections on serverless.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
