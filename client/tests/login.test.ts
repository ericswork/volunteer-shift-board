import { describe, expect, it } from 'vitest';
import { authErrorMessage, safeNextPath } from '../src/lib/login';

describe('authErrorMessage', () => {
  it.each(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'])(
    'gives one message for %s',
    (code) => {
      expect(authErrorMessage(code)).toBe('Email or password is incorrect.');
    },
  );

  it('asks the user to wait after too many attempts', () => {
    expect(authErrorMessage('auth/too-many-requests')).toBe(
      'Too many attempts. Please wait a few minutes and try again.',
    );
  });

  it.each(['auth/network-request-failed', undefined])('falls back to a generic message for %s', (code) => {
    expect(authErrorMessage(code)).toBe("We couldn't sign you in. Please try again.");
  });
});

describe('safeNextPath', () => {
  it.each(['/my-shifts', '/events/abc?from=list'])('accepts the in-app path %s', (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    '//evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    '/\\evil.example',
    '/redirect?to=https://evil.example',
    '',
    null,
  ])('sends %s to the events list instead', (next) => {
    expect(safeNextPath(next)).toBe('/');
  });
});
