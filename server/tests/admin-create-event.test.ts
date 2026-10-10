import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db/client.js';
import * as clock from '../src/lib/clock.js';
import { createTestApp, DEMO_ADMIN, resetDemoUsers, signedInAs } from './helpers.js';

const app = createTestApp();
const now = new Date('2026-10-10T04:00:00Z'); // 2026-10-10 in Manila
const asAdmin = signedInAs('uid-demo-admin', DEMO_ADMIN);
const valid = {
  title: 'Riverside Book Swap',
  cause: 'education',
  date: '2026-10-30',
  location: 'Riverside Community Hall',
  description: 'Bring a book, take a book.',
};
const created: string[] = [];

const createEvent = async (body: object) => {
  const res = await request(app).post('/api/admin/events').set(asAdmin).send(body);
  if (res.status === 201) created.push(res.body.id);
  return res;
};

beforeAll(async () => {
  await resetDemoUsers();
  vi.spyOn(clock, 'now').mockReturnValue(now);
});

afterAll(async () => {
  vi.restoreAllMocks();
  await prisma.event.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
});

describe('POST /api/admin/events', () => {
  it('creates an event that the admin list shows with no shifts yet', async () => {
    const res = await createEvent(valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String) });
    const list = await request(app).get('/api/admin/events').set(asAdmin);
    expect(list.body.events.find((e: { id: string }) => e.id === res.body.id)).toMatchObject({
      title: 'Riverside Book Swap',
      date: '2026-10-30',
      shiftCount: 0,
      status: null,
    });
  });

  it('accepts today', async () => {
    expect((await createEvent({ ...valid, date: '2026-10-10' })).status).toBe(201);
  });

  it.each([
    [{ date: '2026-10-09' }, [{ path: 'date', message: 'Pick today or a later date.' }]],
    [{ date: '2026-02-30' }, [{ path: 'date', message: 'Enter a date.' }]],
    [{ cause: 'pets' }, [{ path: 'cause', message: 'Choose a cause.' }]],
    [
      { title: 'ab', location: '', description: ' ' },
      [
        { path: 'title', message: 'Use 3 to 100 characters.' },
        { path: 'location', message: 'Use 3 to 100 characters.' },
        { path: 'description', message: 'Enter a description.' },
      ],
    ],
  ])('rejects %j with field details', async (changes, details) => {
    const res = await createEvent({ ...valid, ...changes });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(details);
  });
});
