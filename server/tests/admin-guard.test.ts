import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client.js';
import { createTestApp, DEMO_ADMIN, DEMO_VOLUNTEER, resetDemoUsers, signedInAs } from './helpers.js';

const app = createTestApp();
const asVolunteer = signedInAs('uid-demo-volunteer', DEMO_VOLUNTEER);
const asAdmin = signedInAs('uid-demo-admin', DEMO_ADMIN);
const newEvent = { title: 'Sneaky event', cause: 'food', date: '2030-01-05', location: 'Hall', description: 'x' };

beforeAll(async () => {
  await resetDemoUsers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('/api/admin guard', () => {
  it.each([
    ['GET', '/api/admin/events'],
    ['POST', '/api/admin/events'],
  ])('answers an anonymous %s %s with 401 UNAUTHENTICATED', async (method, path) => {
    const res = await request(app)[method === 'GET' ? 'get' : 'post'](path).send(newEvent);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('answers the demo volunteer with 403 FORBIDDEN and creates nothing', async () => {
    const before = await prisma.event.count();

    const res = await request(app).post('/api/admin/events').set(asVolunteer).send(newEvent);

    expect(res.status).toBe(403);
    expect(res.body.error).toEqual({ code: 'FORBIDDEN', message: "You don't have access to this." });
    expect(await prisma.event.count()).toBe(before);
  });

  it('answers a volunteer with 403 even for admin paths that do not exist', async () => {
    const res = await request(app).get('/api/admin/does-not-exist').set(asVolunteer);

    expect(res.status).toBe(403);
  });

  it('lets the demo admin through to a 404 while no admin routes exist', async () => {
    const res = await request(app).post('/api/admin/events').set(asAdmin).send(newEvent);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
