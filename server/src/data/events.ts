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

// Unlike findEvents, this keeps events that have no shifts yet, so admins can staff them
export function findEventsFrom(from: string, db = prisma) {
  return db.event.findMany({
    where: { date: { gte: new Date(from) } },
    orderBy: [{ date: 'asc' }, { title: 'asc' }],
    include: { shifts: shiftsWithSignupCount },
  });
}

export function findEventDate(id: string, db = prisma) {
  return db.event.findUnique({ where: { id }, select: { date: true } });
}

export function createShift(
  data: { eventId: string; name: string; startsAt: Date; endsAt: Date; capacity: number },
  db = prisma,
) {
  return db.shift.create({ data });
}

export function createEvent(
  data: { title: string; cause: Cause; date: Date; location: string; description: string },
  db = prisma,
) {
  return db.event.create({ data });
}
