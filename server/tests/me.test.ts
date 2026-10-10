import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client.js';
import { createTestApp, DEMO_ADMIN, DEMO_VOLUNTEER, resetDemoUsers, signedInAs } from './helpers.js';

const app = createTestApp();
const newEmails: string[] = [];

function newEmail() {
  const email = `new.volunteer.${randomUUID()}@example.net`;
  newEmails.push(email);
  return email;
}

beforeAll(async () => {
  await resetDemoUsers();
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: newEmails } } });
  await prisma.$disconnect();
});

describe('GET /api/me without a valid token', () => {
  it.each([
    ['no Authorization header', {}],
    ['a token that fails verification', { Authorization: 'Bearer not-a-real-token' }],
  ])('answers %s with 401 UNAUTHENTICATED', async (_case, headers) => {
    const res = await request(app).get('/api/me').set(headers);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Please sign in to continue.',
    });
  });

  it('lets public endpoints ignore a token that fails verification', async () => {
    const res = await request(app).get('/api/health').set({ Authorization: 'Bearer stale' });

    expect(res.status).toBe(200);
  });
});

describe('linking Firebase accounts to app users', () => {
  it("links the demo admin's first request to the seeded record", async () => {
    const res = await request(app).get('/api/me').set(signedInAs('uid-demo-admin', DEMO_ADMIN));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'Demo Admin',
      email: DEMO_ADMIN,
      role: 'admin',
      initials: 'DA',
    });
    const record = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_ADMIN } });
    expect(record.firebaseUid).toBe('uid-demo-admin');
  });

  it('finds a linked user by uid on later requests, whatever email the token carries', async () => {
    const res = await request(app)
      .get('/api/me')
      .set(signedInAs('uid-demo-admin', 'changed.address@example.com'));

    expect(res.body).toMatchObject({ email: DEMO_ADMIN, role: 'admin' });
  });

  it('matches the email without regard to letter case', async () => {
    const res = await request(app)
      .get('/api/me')
      .set(signedInAs('uid-demo-volunteer', 'Demo.Volunteer@Example.com'));

    expect(res.body).toMatchObject({
      name: 'Demo Volunteer',
      email: DEMO_VOLUNTEER,
      role: 'volunteer',
      initials: 'DV',
    });
  });

  it('creates a volunteer for an email it has never seen', async () => {
    const email = newEmail();

    const res = await request(app).get('/api/me').set(signedInAs(randomUUID(), email, 'Nova Reyes'));

    expect(res.body).toMatchObject({ name: 'Nova Reyes', email, role: 'volunteer', initials: 'NR' });
  });

  it('creates exactly one record when two first requests arrive together', async () => {
    const email = newEmail();
    const headers = signedInAs(randomUUID(), email);

    const responses = await Promise.all([
      request(app).get('/api/me').set(headers),
      request(app).get('/api/me').set(headers),
    ]);

    expect(responses.map((res) => res.status)).toEqual([200, 200]);
    expect(responses[0]!.body.id).toBe(responses[1]!.body.id);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
    expect(responses[0]!.body.name).toBe(email.split('@')[0]);
  });
});
