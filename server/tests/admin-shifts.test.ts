import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_ADMIN, signedInAs } from './helpers.js';

const app = createTestApp();
const seedDay = new Date('2026-10-10T04:00:00Z');
const asAdmin = signedInAs('uid-demo-admin', DEMO_ADMIN);
const valid = { name: 'Greet and check in', startTime: '08:30', endTime: '09:00', capacity: 2 };

let eventIds: Record<string, string>;
const addShift = (eventId: string, body: object) =>
  request(app).post(`/api/admin/events/${eventId}/shifts`).set(asAdmin).send(body);

beforeAll(async () => {
  await seed(prisma, { now: seedDay, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(seedDay);
  const events = await prisma.event.findMany();
  eventIds = Object.fromEntries(events.map((e) => [e.title, e.id]));
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

describe('POST /api/admin/events/:id/shifts', () => {
  it('adds a shift at Manila wall-clock times on the event date', async () => {
    const res = await addShift(eventIds['Saturday Food Pantry Packing']!, valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'Greet and check in',
      startsAt: '2026-10-17T00:30:00.000Z',
      endsAt: '2026-10-17T01:00:00.000Z',
      capacity: 2,
    });
    const list = await request(app).get('/api/admin/events').set(asAdmin);
    const pantry = list.body.events.find(
      (e: { title: string }) => e.title === 'Saturday Food Pantry Packing',
    );
    expect(pantry).toMatchObject({ shiftCount: 4, capacity: 22 });
  });

  it.each([
    [
      { ...valid, startTime: '10:30', endTime: '09:30' },
      [{ path: 'endTime', message: 'End time must be after the start time.' }],
    ],
    [{ ...valid, name: '  ', capacity: 0 }, [
      { path: 'name', message: 'Enter a shift name.' },
      { path: 'capacity', message: 'Enter a whole number from 1 to 200.' },
    ]],
    [{ ...valid, startTime: '8:30', capacity: 2.5 }, [
      { path: 'startTime', message: 'Enter a start time.' },
      { path: 'capacity', message: 'Enter a whole number from 1 to 200.' },
    ]],
  ])('rejects %j with field details', async (body, details) => {
    const res = await addShift(eventIds['Saturday Food Pantry Packing']!, body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(details);
  });

  it('refuses a past event under the eventId field', async () => {
    const res = await addShift(eventIds['Autumn Coat Drive Sorting']!, valid);

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'eventId', message: 'Shifts can only be added to upcoming events.' },
    ]);
  });

  it.each([randomUUID(), 'not-a-real-id'])('answers an unknown event %s with 404', async (id) => {
    expect((await addShift(id, valid)).status).toBe(404);
  });
});
