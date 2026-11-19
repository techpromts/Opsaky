import "server-only";
import { PrismaClient } from "@prisma/client";

const globalDb = globalThis as unknown as { opsakyPrisma?: PrismaClient };
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalDb.opsakyPrisma) globalDb.opsakyPrisma = new PrismaClient();
  return globalDb.opsakyPrisma;
}
