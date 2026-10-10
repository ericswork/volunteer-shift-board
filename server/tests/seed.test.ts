import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seed, seedAnchorDate } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import { dateInZone } from '../src/lib/time.js';

const TIME_ZONE = 'Asia/Manila';
const now = new Date('2026-10-10T04:00:00Z'); // noon on Saturday 2026-10-10 in Manila

describe('seedAnchorDate', () => {
  it.each([
    ['2026-10-10', '2026-10-17'],
    ['2026-10-14', '2026-10-24'],
    ['2026-10-11', '2026-10-24'],
  ])('seeded on %s, the first event falls on %s', (seedDay, anchor) => {
    expect(seedAnchorDate(seedDay)).toBe(anchor);
  });
});

describe('seed', () => {
  beforeAll(async () => {
    await seed(prisma, { now, timeZone: TIME_ZONE });
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates the tokens.md events with matching dates and totals', async () => {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: { shifts: { include: { _count: { select: { signups: true } } } } },
    });

    const totals = events.map((e) => ({
      date: e.date.toISOString().slice(0, 10),
      title: e.title,
      shifts: e.shifts.length,
      signedUp: e.shifts.reduce((sum, s) => sum + s._count.signups, 0),
      capacity: e.shifts.reduce((sum, s) => sum + s.capacity, 0),
    }));

    expect(totals).toEqual([
      { date: '2026-09-23', title: 'Library Book Sale Setup', shifts: 1, signedUp: 6, capacity: 6 },
      { date: '2026-09-26', title: 'Autumn Coat Drive Sorting', shifts: 1, signedUp: 9, capacity: 10 },
      { date: '2026-10-17', title: 'Saturday Food Pantry Packing', shifts: 3, signedUp: 14, capacity: 20 },
      { date: '2026-10-18', title: 'Harbor Park Cleanup Day', shifts: 2, signedUp: 27, capacity: 30 },
      { date: '2026-10-24', title: 'Weekend Reading Buddies', shifts: 2, signedUp: 4, capacity: 12 },
      { date: '2026-10-25', title: 'Community Garden Planting', shifts: 2, signedUp: 16, capacity: 16 },
      { date: '2026-10-28', title: 'Senior Tech Help Desk', shifts: 1, signedUp: 3, capacity: 8 },
      { date: '2026-10-31', title: 'Shelter Dog Walking', shifts: 2, signedUp: 8, capacity: 10 },
    ]);
  });

  it('stores shift times as Manila wall-clock times', async () => {
    const shift = await prisma.shift.findFirstOrThrow({ where: { name: 'Sort donations' } });

    expect(shift.startsAt.toISOString()).toBe('2026-10-17T01:00:00.000Z');
    expect(shift.endsAt.toISOString()).toBe('2026-10-17T02:30:00.000Z');
  });

  it('signs the demo volunteer up for three upcoming and two past shifts', async () => {
    const signups = await prisma.signup.findMany({
      where: { user: { email: 'demo.volunteer@example.com' } },
      include: { shift: true },
      orderBy: { shift: { startsAt: 'asc' } },
    });

    expect(signups.map((s) => s.shift.name)).toEqual([
      'Set up tables',
      'Sort and fold coats',
      'Pack boxes',
      'Tech help desk',
      'Morning walkers',
    ]);
  });

  it('gives the demo admin the admin role', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'demo.admin@example.com' } });

    expect(admin.role).toBe('admin');
  });

  it('builds the Sort donations roster from the mockup', async () => {
    const roster = await prisma.signup.findMany({
      where: { shift: { name: 'Sort donations' } },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    expect(roster.map((s) => [s.user.name, dateInZone(s.createdAt, TIME_ZONE)])).toEqual([
      ['Maya Reyes', '2026-10-03'],
      ['Daniel Kim', '2026-10-04'],
      ['Priya Nair', '2026-10-04'],
      ['Tomás Silva', '2026-10-06'],
      ['Hannah Lee', '2026-10-07'],
      ['Omar Haddad', '2026-10-09'],
    ]);
  });

  it('never gives a volunteer overlapping shifts', async () => {
    const [{ overlaps }] = await prisma.$queryRaw<{ overlaps: number }[]>`
      SELECT count(*)::int AS overlaps
      FROM signups a
      JOIN signups b ON a.user_id = b.user_id AND a.id < b.id
      JOIN shifts sa ON sa.id = a.shift_id
      JOIN shifts sb ON sb.id = b.shift_id
      WHERE sa.starts_at < sb.ends_at AND sb.starts_at < sa.ends_at`;

    expect(overlaps).toBe(0);
  });

  it('leaves identical row counts when run again', async () => {
    const counts = () =>
      Promise.all([prisma.event.count(), prisma.shift.count(), prisma.signup.count(), prisma.user.count()]);
    const before = await counts();

    await seed(prisma, { now, timeZone: TIME_ZONE });

    expect(await counts()).toEqual(before);
  }, 60_000);
});
