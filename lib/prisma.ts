import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaInstance(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    // Create a connection pool via node-postgres pg
    const pool = new pg.Pool({
      connectionString,
      max: 10, // Maintain a modest serverless connection limit
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Create the adapter
    const adapter = new PrismaPg(pool);

    // Instantiate client with adapter
    return new PrismaClient({ adapter });
  }

  // Graceful fallback for static compilations
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaInstance();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
