import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import * as signupsData from '../src/data/signups.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_VOLUNTEER, signedInAs } from './helpers.js';

const app = createTestApp();
const now = new Date('2026-10-10T04:00:00Z'); // noon on Saturday 2026-10-10 in Manila
const asDemoVolunteer = signedInAs('uid-demo-volunteer', DEMO_VOLUNTEER);
const newVolunteer = () => signedInAs(randomUUID(), `volunteer.${randomUUID()}@signup.test`);

let shiftIds: Record<string, string>;
const signUp = (shift: string, headers: Record<string, string> = {}) =>
  request(app).post(`/api/shifts/${shiftIds[shift] ?? shift}/signup`).set(headers);
const countFor = (shift: string) => prisma.signup.count({ where: { shiftId: shiftIds[shift] } });

beforeAll(async () => {
  await seed(prisma, { now, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(now);
  const shifts = await prisma.shift.findMany();
  shiftIds = Object.fromEntries(shifts.map((s) => [s.name, s.id]));
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@signup.test' } } });
  await prisma.$disconnect();
});

describe('POST /api/shifts/:id/signup', () => {
  it('answers an anonymous request with 401 and creates nothing', async () => {
    const res = await signUp('Sort donations');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(await countFor('Sort donations')).toBe(6);
  });

  it('signs Demo Volunteer up for Sort donations, back to back with Pack boxes', async () => {
    const res = await signUp('Sort donations', asDemoVolunteer);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      shift: {
        id: shiftIds['Sort donations'],
        capacity: 8,
        signedUpCount: 7,
        spotsLeft: 1,
        status: 'filling',
      },
    });
    expect(await countFor('Sort donations')).toBe(7);
  });

  it.each([
    {
      case: 'a second identical sign-up',
      shift: 'Sort donations',
      headers: () => asDemoVolunteer,
      code: 'ALREADY_SIGNED_UP',
      message: "You're already signed up for this shift.",
    },
    {
      case: 'a full shift',
      shift: 'Load delivery vans',
      headers: newVolunteer,
      code: 'SHIFT_FULL',
      message: 'This shift just filled up.',
    },
    {
      case: 'a shift overlapping one already held',
      shift: 'Kennel helpers',
      headers: () => asDemoVolunteer,
      code: 'SHIFT_OVERLAP',
      message: "This shift overlaps another shift you've signed up for.",
    },
  ])('refuses $case with 409', async ({ shift, headers, code, message }) => {
    const before = await countFor(shift);

    const res = await signUp(shift, headers());

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code, message });
    expect(await countFor(shift)).toBe(before);
  });

  it('refuses a shift that has already started', async () => {
    vi.mocked(clock.now).mockReturnValue(new Date('2026-10-17T01:30:00Z')); // Sort donations began at 01:00

    const res = await signUp('Sort donations', newVolunteer());

    vi.mocked(clock.now).mockReturnValue(now);
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'SHIFT_STARTED', message: 'This shift has already started.' });
  });

  it.each([randomUUID(), 'not-a-real-id'])('answers an unknown shift %s with 404', async (id) => {
    const res = await signUp(id, asDemoVolunteer);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('falls back on the unique constraint when the duplicate check is bypassed', async () => {
    const findSignup = vi.spyOn(signupsData, 'findSignup').mockResolvedValue(null);
    const findOverlap = vi.spyOn(signupsData, 'findOverlappingSignup').mockResolvedValue(null);

    const res = await signUp('Sort donations', asDemoVolunteer);

    findSignup.mockRestore();
    findOverlap.mockRestore();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_SIGNED_UP');
    expect(await countFor('Sort donations')).toBe(7);
  });
});
