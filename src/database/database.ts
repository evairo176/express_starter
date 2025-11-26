import { PrismaClient } from '@prisma/client';

declare global {
  /* eslint-disable no-var */
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ||
  new PrismaClient({
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;
