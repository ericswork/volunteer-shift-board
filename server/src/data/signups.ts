import { prisma } from '../db/client.js';
import type { Prisma } from '../generated/prisma/client.js';

type Tx = Prisma.TransactionClient;

// The only raw SQL here: Prisma's query builder has no FOR UPDATE. Another transaction asking
// for the same row now waits until this one commits.
export async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
}

export async function lockShift(tx: Tx, shiftId: string) {
  const rows = await tx.$queryRaw<{ capacity: number; starts_at: Date; ends_at: Date }[]>`
    SELECT capacity, starts_at, ends_at FROM shifts WHERE id = ${shiftId}::uuid FOR UPDATE`;
  const row = rows[0];
  return row ? { capacity: row.capacity, startsAt: row.starts_at, endsAt: row.ends_at } : null;
}

export function findSignup(tx: Tx, userId: string, shiftId: string) {
  return tx.signup.findUnique({ where: { userId_shiftId: { userId, shiftId } } });
}

export function countSignups(tx: Tx, shiftId: string) {
  return tx.signup.count({ where: { shiftId } });
}

// Half-open ranges: a shift ending at 10:30 doesn't overlap one starting at 10:30
export function findOverlappingSignup(tx: Tx, userId: string, range: { startsAt: Date; endsAt: Date }) {
  return tx.signup.findFirst({
    where: { userId, shift: { startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } } },
  });
}

export function createSignup(tx: Tx, userId: string, shiftId: string) {
  return tx.signup.create({ data: { userId, shiftId } });
}

export function findOwnSignup(signupId: string, userId: string, db = prisma) {
  return db.signup.findFirst({
    where: { id: signupId, userId },
    include: { shift: { select: { startsAt: true } } },
  });
}

export async function deleteOwnSignup(signupId: string, userId: string, db = prisma) {
  const { count } = await db.signup.deleteMany({ where: { id: signupId, userId } });
  return count > 0;
}

export function findSignupsOverlapping(
  userId: string,
  range: { startsAt: Date; endsAt: Date },
  db = prisma,
) {
  return db.signup.findMany({
    where: { userId, shift: { startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } } },
    select: { id: true, shiftId: true, shift: { select: { startsAt: true, endsAt: true } } },
  });
}

export function findSignupsForUser(
  userId: string,
  { shiftEnds, order }: { shiftEnds: Prisma.DateTimeFilter; order: 'asc' | 'desc' },
  db = prisma,
) {
  return db.signup.findMany({
    where: { userId, shift: { endsAt: shiftEnds } },
    orderBy: { shift: { startsAt: order } },
    include: { shift: { include: { event: { select: { id: true, title: true, location: true } } } } },
  });
}
