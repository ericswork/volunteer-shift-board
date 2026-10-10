import { API_URL } from '../config';
import { auth } from './firebase';

export type ErrorDetail = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MAX_RETRIES = 3;

// A 4xx means the request itself is wrong (such as an unknown event), so repeating it can't help
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  // getIdToken refreshes the token itself when it is about to expire
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "We couldn't reach the server.");
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.details,
    );
  }

  // Render's proxy can answer with an HTML page while the server wakes up
  if (body === null) {
    throw new ApiError(response.status, 'INVALID_RESPONSE', 'The server sent an unexpected response.');
  }

  return body as T;
}
