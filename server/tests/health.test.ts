import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as healthData from '../src/data/health.js';
import { checkHealth } from '../src/services/health.js';

const app = createApp({ clientOrigin: 'http://localhost:5173' });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  it('reports ok when the database answers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('reports DATABASE_UNAVAILABLE when the database query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(healthData, 'pingDatabase').mockRejectedValue(new Error('connection refused'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});

describe('checkHealth', () => {
  it('gives up when the database does not answer within 10 seconds', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(healthData, 'pingDatabase').mockReturnValue(new Promise(() => {}));
    vi.useFakeTimers();

    let gaveUp = false;
    const result = checkHealth().catch((error: unknown) => {
      gaveUp = true;
      return error;
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(gaveUp).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toMatchObject({ status: 503, code: 'DATABASE_UNAVAILABLE' });
  });
});
