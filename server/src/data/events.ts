import { prisma } from '../db/client.js';
import type { Cause } from '../generated/prisma/enums.js';

export type EventSearch = { from: string; to?: string; cause?: Cause; q?: string };

const shiftsWithSignupCount = {
  orderBy: { startsAt: 'asc' },
  include: { _count: { select: { signups: true } } },
} as const;

export function findEvents({ from, to, cause, q }: EventSearch, db = prisma) {
  return db.event.findMany({
    where: {
      date: { gte: new Date(from), lte: to ? new Date(to) : undefined },
      cause,
      shifts: { some: {} },
      OR: q
        ? [
            { title: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: { shifts: shiftsWithSignupCount },
  });
}

export function findEventById(id: string, db = prisma) {
  return db.event.findUnique({ where: { id }, include: { shifts: shiftsWithSignupCount } });
}
