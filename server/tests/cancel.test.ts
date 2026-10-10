import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_VOLUNTEER, signedInAs } from './helpers.js';

const app = createTestApp();
const seedDay = new Date('2026-10-10T04:00:00Z');
const asDemoVolunteer = signedInAs('uid-demo-volunteer', DEMO_VOLUNTEER);
const HOUR = 60 * 60 * 1000;

// The demo volunteer's sign-up for a shift, with that shift's start time
async function demoSignup(shiftName: string) {
  const signup = await prisma.signup.findFirstOrThrow({
    where: { user: { email: DEMO_VOLUNTEER }, shift: { name: shiftName } },
    include: { shift: true },
  });
  return { id: signup.id, shiftId: signup.shiftId, startsAt: signup.shift.startsAt };
}

const cancel = (signupId: string, headers: Record<string, string> = asDemoVolunteer) =>
  request(app).delete(`/api/signups/${signupId}`).set(headers);
const setNow = (date: Date) => vi.mocked(clock.now).mockReturnValue(date);

beforeAll(async () => {
  await seed(prisma, { now: seedDay, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(seedDay);
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

describe('DELETE /api/signups/:id', () => {
  it('answers an anonymous request with 401', async () => {
    const { id } = await demoSignup('Pack boxes');

    const res = await cancel(id, {});

    expect(res.status).toBe(401);
  });

  it('cancels Pack boxes three days ahead and frees a spot', async () => {
    const { id, shiftId, startsAt } = await demoSignup('Pack boxes');
    setNow(new Date(startsAt.getTime() - 72 * HOUR));

    const res = await cancel(id);

    expect(res.status).toBe(204);
    expect(await prisma.signup.count({ where: { shiftId } })).toBe(3);
  });

  it("answers 404 for someone else's sign-up and leaves it alone", async () => {
    const theirs = await prisma.signup.findFirstOrThrow({ where: { user: { name: 'Maya Reyes' } } });

    const res = await cancel(theirs.id);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(await prisma.signup.findUnique({ where: { id: theirs.id } })).not.toBeNull();
  });

  it('allows cancelling 25 hours ahead', async () => {
    const { id, startsAt } = await demoSignup('Tech help desk');
    setNow(new Date(startsAt.getTime() - 25 * HOUR));

    expect((await cancel(id)).status).toBe(204);
  });

  it('refuses cancelling 23 hours ahead and keeps the sign-up', async () => {
    const { id, startsAt } = await demoSignup('Morning walkers');
    setNow(new Date(startsAt.getTime() - 23 * HOUR));

    const res = await cancel(id);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      code: 'CANCELLATION_CLOSED',
      message: 'Cancellations close 24 hours before the shift. Please contact the organizer.',
    });
    expect(await prisma.signup.findUnique({ where: { id } })).not.toBeNull();
  });

  it.each([randomUUID(), 'not-a-real-id'])('answers an unknown sign-up %s with 404', async (id) => {
    expect((await cancel(id)).status).toBe(404);
  });
});
