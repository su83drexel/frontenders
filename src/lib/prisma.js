import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient in dev to avoid exhausting connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
