import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp } from './helpers.js';

const app = createTestApp();
const now = new Date('2026-10-10T04:00:00Z'); // noon on Saturday 2026-10-10 in Manila

const UPCOMING = [
  'Saturday Food Pantry Packing',
  'Harbor Park Cleanup Day',
  'Weekend Reading Buddies',
  'Community Garden Planting',
  'Senior Tech Help Desk',
  'Shelter Dog Walking',
];

beforeAll(async () => {
  await seed(prisma, { now, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(now);
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

async function listTitles(query = ''): Promise<string[]> {
  const res = await request(app).get(`/api/events?${query}`);
  expect(res.status).toBe(200);
  return res.body.events.map((event: { title: string }) => event.title);
}

describe('GET /api/events', () => {
  it('lists the six upcoming events soonest first, total 6', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.events.map((event: { title: string }) => event.title)).toEqual(UPCOMING);
    expect(res.body.total).toBe(6);
  });

  it('sums shifts into event totals and statuses', async () => {
    const res = await request(app).get('/api/events');

    expect(res.body.events[0]).toEqual({
      id: expect.any(String),
      title: 'Saturday Food Pantry Packing',
      cause: 'food',
      date: '2026-10-17',
      startsAt: '2026-10-17T01:00:00.000Z',
      endsAt: '2026-10-17T05:00:00.000Z',
      location: 'Riverside Community Hall',
      capacity: 20,
      signedUpCount: 14,
      spotsLeft: 6,
      status: 'open',
    });
    expect(res.body.events.map((e: { status: string }) => e.status)).toEqual([
      'open',
      'filling',
      'open',
      'full',
      'open',
      'filling',
    ]);
  });

  it.each([
    ['q=library', ['Weekend Reading Buddies']],
    ['q=GARDEN', ['Community Garden Planting']],
    ['q=%20%20garden%20', ['Community Garden Planting']],
    ['q=', UPCOMING],
    ['cause=animals', ['Shelter Dog Walking']],
    ['when=next7', ['Saturday Food Pantry Packing']],
    ['when=next30', UPCOMING],
    ['openOnly=true', UPCOMING.filter((title) => title !== 'Community Garden Planting')],
  ])('?%s', async (query, expected) => {
    expect(await listTitles(query)).toEqual(expected);
  });

  it.each([
    ['when=tomorrow', 'when'],
    [`q=${'a'.repeat(101)}`, 'q'],
    ['cause=pets', 'cause'],
    ['openOnly=yes', 'openOnly'],
  ])('rejects ?%s with VALIDATION_ERROR', async (query, path) => {
    const res = await request(app).get(`/api/events?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ path, message: expect.any(String) }]);
  });
});

describe('events left out of the list', () => {
  const ids: string[] = [];
  let emptyEventId: string;

  async function createEvent(title: string, date: string, withShift: boolean) {
    const shift = {
      name: 'Test shift',
      startsAt: new Date(`${date}T10:00:00Z`),
      endsAt: new Date(`${date}T12:00:00Z`),
      capacity: 5,
    };
    const event = await prisma.event.create({
      data: {
        title,
        cause: 'food',
        date: new Date(date),
        location: 'Test hall',
        description: 'Created by events.test.ts',
        shifts: { create: withShift ? [shift] : [] },
      },
    });
    ids.push(event.id);
    return event.id;
  }

  beforeAll(async () => {
    emptyEventId = await createEvent('No shifts yet', '2026-10-20', false);
    await createEvent('Happened yesterday', '2026-10-09', true);
    await createEvent('Happening today', '2026-10-10', true);
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: { in: ids } } });
  });

  it('leaves out events with no shifts and events dated before today', async () => {
    const titles = await listTitles();

    expect(titles).not.toContain('No shifts yet');
    expect(titles).not.toContain('Happened yesterday');
    expect(titles).toContain('Happening today');
  });

  it('still opens an event with no shifts by its link, without start or end times', async () => {
    const res = await request(app).get(`/api/events/${emptyEventId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ startsAt: null, endsAt: null, shifts: [] });
  });
});

describe('GET /api/events/:id', () => {
  it('returns the Food Pantry shifts in start order with their statuses', async () => {
    const { id } = await prisma.event.findFirstOrThrow({
      where: { title: 'Saturday Food Pantry Packing' },
    });

    const res = await request(app).get(`/api/events/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      date: '2026-10-17',
      spotsLeft: 6,
      status: 'open',
      description: expect.stringContaining('pack weekly boxes'),
    });
    expect(res.body.shifts[0]).toEqual({
      id: expect.any(String),
      name: 'Sort donations',
      startsAt: '2026-10-17T01:00:00.000Z',
      endsAt: '2026-10-17T02:30:00.000Z',
      capacity: 8,
      signedUpCount: 6,
      spotsLeft: 2,
      status: 'filling',
    });
    expect(
      res.body.shifts.map((s: { name: string; status: string; spotsLeft: number }) => [
        s.name,
        s.status,
        s.spotsLeft,
      ]),
    ).toEqual([
      ['Sort donations', 'filling', 2],
      ['Pack boxes', 'open', 4],
      ['Load delivery vans', 'full', 0],
    ]);
  });

  it.each([randomUUID(), 'not-a-real-id'])('answers %s with NOT_FOUND', async (id) => {
    const res = await request(app).get(`/api/events/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
