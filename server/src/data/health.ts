import { prisma } from '../db/client.js';

export async function pingDatabase(db = prisma) {
  await db.$queryRaw`SELECT 1`;
}
