import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seed } from '../prisma/seed/seed.js';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { dateInZone } from '../src/lib/time.js';
import { createTestApp, DEMO_ADMIN, signedInAs } from './helpers.js';

const app = createTestApp();
const seedDay = new Date('2026-10-10T04:00:00Z');
const asAdmin = signedInAs('uid-demo-admin', DEMO_ADMIN);
let sortDonations: { id: string; startsAt: Date };

const roster = (shiftId: string) =>
  request(app).get(`/api/admin/shifts/${shiftId}/roster`).set(asAdmin);
const remove = (signupId: string) =>
  request(app).delete(`/api/admin/signups/${signupId}`).set(asAdmin);

beforeAll(async () => {
  await seed(prisma, { now: seedDay, timeZone: 'Asia/Manila' });
  vi.spyOn(clock, 'now').mockReturnValue(seedDay);
  sortDonations = await prisma.shift.findFirstOrThrow({ where: { name: 'Sort donations' } });
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.$disconnect();
});

describe('GET /api/admin/shifts/:id/roster', () => {
  it('lists the Sort donations roster oldest first', async () => {
    const res = await roster(sortDonations.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Sort donations',
      startsAt: '2026-10-17T01:00:00.000Z',
      capacity: 8,
      signedUpCount: 6,
      status: 'filling',
    });
    expect(
      res.body.signups.map((s: { name: string; initials: string; signedUpAt: string }) => [
        s.name,
        s.initials,
        dateInZone(new Date(s.signedUpAt), 'Asia/Manila'),
      ]),
    ).toEqual([
      ['Maya Reyes', 'MR', '2026-10-03'],
      ['Daniel Kim', 'DK', '2026-10-04'],
      ['Priya Nair', 'PN', '2026-10-04'],
      ['Tomás Silva', 'TS', '2026-10-06'],
      ['Hannah Lee', 'HL', '2026-10-07'],
      ['Omar Haddad', 'OH', '2026-10-09'],
    ]);
  });

  it.each([randomUUID(), 'not-a-real-id'])('answers an unknown shift %s with 404', async (id) => {
    expect((await roster(id)).status).toBe(404);
  });
});

describe('DELETE /api/admin/signups/:id', () => {
  it('removes a volunteer three hours before the shift, ignoring the 24-hour window', async () => {
    vi.mocked(clock.now).mockReturnValue(new Date(sortDonations.startsAt.getTime() - 3 * 3600_000));
    const maya = (await roster(sortDonations.id)).body.signups[0];

    const res = await remove(maya.signupId);

    expect(res.status).toBe(204);
    const names = (await roster(sortDonations.id)).body.signups.map((s: { name: string }) => s.name);
    expect(names).not.toContain('Maya Reyes');
    expect(names).toHaveLength(5);
  });

  it('answers 404 when the sign-up is already gone', async () => {
    const signup = await prisma.signup.findFirstOrThrow({ where: { shiftId: sortDonations.id } });
    await remove(signup.id);

    const res = await remove(signup.id);

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'That sign-up no longer exists.' });
  });
});
