import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_ADMIN, signedInAs } from './helpers.js';

const app = createTestApp();
const seedDay = new Date('2026-10-10T04:00:00Z');
const asAdmin = signedInAs('uid-demo-admin', DEMO_ADMIN);

beforeAll(async () => {
  await seed(prisma, { now: seedDay, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(seedDay);
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

describe('GET /api/admin/events', () => {
  it('lists the six upcoming events with shift counts, sign-ups and statuses', async () => {
    const res = await request(app).get('/api/admin/events').set(asAdmin);

    expect(res.status).toBe(200);
    expect(
      res.body.events.map((e: Record<string, unknown>) => [
        e.title,
        e.shiftCount,
        `${e.signedUpCount}/${e.capacity}`,
        e.status,
      ]),
    ).toEqual([
      ['Saturday Food Pantry Packing', 3, '14/20', 'open'],
      ['Harbor Park Cleanup Day', 2, '27/30', 'filling'],
      ['Weekend Reading Buddies', 2, '4/12', 'open'],
      ['Community Garden Planting', 2, '16/16', 'full'],
      ['Senior Tech Help Desk', 1, '3/8', 'open'],
      ['Shelter Dog Walking', 2, '8/10', 'filling'],
    ]);
    expect(res.body.events[0]).toEqual({
      id: expect.any(String),
      title: 'Saturday Food Pantry Packing',
      cause: 'food',
      date: '2026-10-17',
      shiftCount: 3,
      signedUpCount: 14,
      capacity: 20,
      status: 'open',
    });
  });

  it('includes an event with no shifts yet, with status null', async () => {
    const empty = await prisma.event.create({
      data: {
        title: 'Not staffed yet',
        cause: 'food',
        date: new Date('2026-10-20'),
        location: 'Test hall',
        description: 'Created by admin-events.test.ts',
      },
    });

    const res = await request(app).get('/api/admin/events').set(asAdmin);

    await prisma.event.delete({ where: { id: empty.id } });
    const titles = res.body.events.map((e: { title: string }) => e.title);
    expect(titles.indexOf('Not staffed yet')).toBe(2);
    expect(res.body.events[2]).toMatchObject({
      shiftCount: 0,
      signedUpCount: 0,
      capacity: 0,
      status: null,
    });
    expect(titles).not.toContain('Autumn Coat Drive Sorting');
  });
});
