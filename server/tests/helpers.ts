import { createApp } from '../src/app.js';
import type { TokenVerifier } from '../src/lib/firebase-token.js';

// Stands in for Firebase: "test-token:<uid>:<email>[:<name>]" is valid, anything else is not
export const fakeVerifyToken: TokenVerifier = async (token) => {
  const [prefix, uid, email, name] = token.split(':');
  if (prefix !== 'test-token' || !uid || !email) return null;
  return { uid, email, name };
};

export function createTestApp(clientOrigin = 'http://localhost:5173') {
  return createApp({ clientOrigin, verifyToken: fakeVerifyToken });
}

export function signedInAs(uid: string, email: string, name?: string) {
  return { Authorization: `Bearer test-token:${uid}:${email}${name ? `:${name}` : ''}` };
}
