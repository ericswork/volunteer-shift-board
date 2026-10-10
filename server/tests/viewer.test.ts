import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_VOLUNTEER, signedInAs } from './helpers.js';

const app = createTestApp();
const seedDay = new Date('2026-10-10T04:00:00Z');
const asDemoVolunteer = signedInAs('uid-demo-volunteer', DEMO_VOLUNTEER);

async function shiftsOf(title: string, headers: Record<string, string> = asDemoVolunteer) {
  const { id } = await prisma.event.findFirstOrThrow({ where: { title } });
  const res = await request(app).get(`/api/events/${id}`).set(headers);
  expect(res.status).toBe(200);
  return res.body.shifts as { name: string; viewer?: { state: string } }[];
}
const states = (shifts: { name: string; viewer?: { state: string } }[]) =>
  Object.fromEntries(shifts.map((s) => [s.name, s.viewer?.state]));

beforeAll(async () => {
  await seed(prisma, { now: seedDay, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(seedDay);
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

describe('viewer state on GET /api/events/:id', () => {
  it('labels the Food Pantry shifts for Demo Volunteer', async () => {
    const shifts = await shiftsOf('Saturday Food Pantry Packing');

    expect(states(shifts)).toEqual({
      'Sort donations': 'open',
      'Pack boxes': 'signed_up',
      'Load delivery vans': 'full',
    });
    expect(shifts.find((s) => s.name === 'Pack boxes')!.viewer).toEqual({
      state: 'signed_up',
      signupId: expect.any(String),
      canCancel: true,
    });
  });

  it('shows Kennel helpers as overlapping Morning walkers before trying', async () => {
    expect(states(await shiftsOf('Shelter Dog Walking'))).toEqual({
      'Morning walkers': 'signed_up',
      'Kennel helpers': 'overlap',
    });
  });

  it('shows started shifts, and keeps a held one as signed up without cancelling', async () => {
    vi.mocked(clock.now).mockReturnValue(new Date('2026-10-17T01:30:00Z')); // Sort donations began

    const shifts = await shiftsOf('Saturday Food Pantry Packing');

    vi.mocked(clock.now).mockReturnValue(seedDay);
    expect(states(shifts)['Sort donations']).toBe('started');
    expect(shifts.find((s) => s.name === 'Pack boxes')!.viewer).toMatchObject({
      state: 'signed_up',
      canCancel: false,
    });
  });

  it('adds no viewer field for anonymous requests', async () => {
    const shifts = await shiftsOf('Saturday Food Pantry Packing', {});

    expect(shifts.every((s) => !('viewer' in s))).toBe(true);
  });
});

describe('GET /api/me/signups', () => {
  const names = (res: request.Response) =>
    res.body.signups.map((s: { shift: { name: string } }) => s.shift.name);

  it("lists Demo Volunteer's upcoming shifts soonest first", async () => {
    const res = await request(app).get('/api/me/signups').set(asDemoVolunteer);

    expect(res.status).toBe(200);
    expect(names(res)).toEqual(['Pack boxes', 'Tech help desk', 'Morning walkers']);
    expect(res.body.total).toBe(3);
    expect(res.body.signups[0]).toEqual({
      signupId: expect.any(String),
      canCancel: true,
      shift: {
        id: expect.any(String),
        name: 'Pack boxes',
        startsAt: '2026-10-17T02:30:00.000Z',
        endsAt: '2026-10-17T04:00:00.000Z',
      },
      event: {
        id: expect.any(String),
        title: 'Saturday Food Pantry Packing',
        location: 'Riverside Community Hall',
      },
    });
  });

  it('lists past shifts most recent first', async () => {
    const res = await request(app).get('/api/me/signups?when=past').set(asDemoVolunteer);

    expect(names(res)).toEqual(['Sort and fold coats', 'Set up tables']);
    expect(res.body.signups.every((s: { canCancel: boolean }) => !s.canCancel)).toBe(true);
  });

  it('rejects an unknown when with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).get('/api/me/signups?when=bogus').set(asDemoVolunteer);

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ path: 'when', message: expect.any(String) }]);
  });

  it('requires sign-in', async () => {
    expect((await request(app).get('/api/me/signups')).status).toBe(401);
  });
});
