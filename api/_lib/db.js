import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across serverless invocations so we do not
// exhaust Postgres connections. In dev, store it on globalThis so hot reloads
// do not spawn a new client every time.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
