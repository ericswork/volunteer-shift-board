import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, signedInAs } from './helpers.js';

const app = createTestApp();
const now = new Date('2026-10-10T04:00:00Z');
const BURST_TIMEOUT_MS = 30_000;

let eventId: string;

// Creates the volunteers before the race, so the burst itself is only sign-up transactions
async function volunteers(count: number) {
  const headers = Array.from({ length: count }, () =>
    signedInAs(randomUUID(), `racer.${randomUUID()}@concurrency.test`),
  );
  await Promise.all(headers.map((h) => request(app).get('/api/me').set(h).expect(200)));
  return headers;
}

async function newShift(capacity: number, startHour: number) {
  const shift = await prisma.shift.create({
    data: {
      eventId,
      name: `Race for ${capacity}`,
      startsAt: new Date(`2026-11-20T${String(startHour).padStart(2, '0')}:00:00Z`),
      endsAt: new Date(`2026-11-20T${String(startHour + 1).padStart(2, '0')}:00:00Z`),
      capacity,
    },
  });
  return shift.id;
}

const signUp = (shiftId: string, headers: Record<string, string>) =>
  request(app).post(`/api/shifts/${shiftId}/signup`).set(headers);
const outcomes = (responses: request.Response[]) =>
  responses.map((res) => (res.status === 201 ? 201 : res.body.error.code)).sort();

beforeAll(async () => {
  await seed(prisma, { now, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(now);
  const event = await prisma.event.create({
    data: {
      title: 'Concurrency test event',
      cause: 'community',
      date: new Date('2026-11-20'),
      location: 'Test hall',
      description: 'Created by signups-concurrency.test.ts',
    },
  });
  eventId = event.id;
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.event.delete({ where: { id: eventId } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@concurrency.test' } } });
  await prisma.$disconnect();
});

describe('simultaneous sign-ups', () => {
  it('lets exactly three of ten volunteers into a capacity-3 shift', async () => {
    const shiftId = await newShift(3, 1);
    const racers = await volunteers(10);

    const responses = await Promise.all(racers.map((h) => signUp(shiftId, h)));

    expect(outcomes(responses)).toEqual([201, 201, 201, ...Array(7).fill('SHIFT_FULL')]);
    expect(await prisma.signup.count({ where: { shiftId } })).toBe(3);
  }, BURST_TIMEOUT_MS);

  it('gives the last spot to exactly one of two volunteers', async () => {
    const shiftId = await newShift(1, 3);
    const racers = await volunteers(2);

    const responses = await Promise.all(racers.map((h) => signUp(shiftId, h)));

    expect(outcomes(responses)).toEqual([201, 'SHIFT_FULL']);
    expect(await prisma.signup.count({ where: { shiftId } })).toBe(1);
  }, BURST_TIMEOUT_MS);

  it('turns a double click into exactly one sign-up', async () => {
    const shiftId = await newShift(5, 5);
    const [volunteer] = await volunteers(1);

    const responses = await Promise.all([signUp(shiftId, volunteer!), signUp(shiftId, volunteer!)]);

    expect(outcomes(responses)).toEqual([201, 'ALREADY_SIGNED_UP']);
    expect(await prisma.signup.count({ where: { shiftId } })).toBe(1);
  }, BURST_TIMEOUT_MS);

  it('lets one volunteer win only one of two overlapping shifts sent together', async () => {
    const shifts = await prisma.shift.findMany({
      where: { name: { in: ['Morning walkers', 'Kennel helpers'] } },
    });
    const [volunteer] = await volunteers(1);

    const responses = await Promise.all(shifts.map((s) => signUp(s.id, volunteer!)));

    expect(outcomes(responses)).toEqual([201, 'SHIFT_OVERLAP']);
  }, BURST_TIMEOUT_MS);
});
