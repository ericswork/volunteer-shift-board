import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, shouldRetry } from '../src/lib/api';

function respondWith(body: string, status = 200, contentType = 'application/json') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(body, { status, headers: { 'Content-Type': contentType } })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('returns the parsed JSON body', async () => {
    respondWith('{"status":"ok"}');

    await expect(apiFetch('/api/health')).resolves.toEqual({ status: 'ok' });
  });

  it('turns the error envelope into an ApiError with its code and message', async () => {
    respondWith('{"error":{"code":"SHIFT_FULL","message":"This shift just filled up."}}', 409);

    await expect(apiFetch('/api/shifts/1/signup')).rejects.toMatchObject({
      status: 409,
      code: 'SHIFT_FULL',
      message: 'This shift just filled up.',
    });
  });

  it('rejects an HTML page from a waking server', async () => {
    respondWith('<html>Service waking up</html>', 200, 'text/html');

    await expect(apiFetch('/api/health')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiFetch('/api/health')).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch('/api/health')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});

describe('shouldRetry', () => {
  it('gives up at once on a client error such as an unknown event', () => {
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', 'Not found'))).toBe(false);
  });

  it('retries server and network errors up to three times', () => {
    const serverError = new ApiError(500, 'INTERNAL_ERROR', 'Oops');
    const networkError = new ApiError(0, 'NETWORK_ERROR', 'Offline');

    expect(shouldRetry(2, serverError)).toBe(true);
    expect(shouldRetry(3, serverError)).toBe(false);
    expect(shouldRetry(0, networkError)).toBe(true);
  });
});
