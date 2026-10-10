import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const clientOrigin = 'https://shift-board.vercel.app';
const app = createApp({ clientOrigin });

describe('createApp', () => {
  it('answers unknown API routes with the NOT_FOUND envelope', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });

  it.each([clientOrigin, 'http://localhost:5173'])('allows requests from %s', async (origin) => {
    const res = await request(app).get('/api/nope').set('Origin', origin);

    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });

  it('does not allow requests from other sites', async () => {
    const res = await request(app).get('/api/nope').set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
