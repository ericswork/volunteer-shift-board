import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { errorHandler, notFoundHandler } from '../src/middleware/errors.js';
import { validate } from '../src/middleware/validate.js';

function appWith(addRoutes: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  addRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('hides internal details of unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = appWith((app) => {
      app.get('/boom', () => {
        throw new Error('connection string leaked: hunter2');
      });
    });

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong on our side. Please try again.',
      },
    });
    expect(res.text).not.toContain('hunter2');
  });

  it('catches errors from async handlers', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = appWith((app) => {
      app.get('/async-boom', async () => {
        throw new Error('rejected');
      });
    });

    const res = await request(app).get('/async-boom');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('answers malformed JSON with BAD_REQUEST', async () => {
    const app = appWith((app) => {
      app.post('/echo', (req, res) => {
        res.json(req.body);
      });
    });

    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 'BAD_REQUEST',
      message: 'The request body is not valid JSON.',
    });
  });
});

describe('validate', () => {
  const app = appWith((app) => {
    app.get(
      '/events',
      validate({ query: z.object({ when: z.enum(['next7', 'next30', 'all']) }) }),
      (_req, res) => {
        res.json(res.locals.query);
      },
    );
  });

  it('lists each invalid field', async () => {
    const res = await request(app).get('/events?when=tomorrow');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { path: 'when', message: expect.any(String) },
    ]);
  });

  it('passes parsed values to the handler', async () => {
    const res = await request(app).get('/events?when=next7');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ when: 'next7' });
  });
});
