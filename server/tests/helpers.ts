import { createApp } from '../src/app.js';
import { prisma } from '../src/db/client.js';
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

export const DEMO_ADMIN = 'demo.admin@example.com';
export const DEMO_VOLUNTEER = 'demo.volunteer@example.com';

// Puts both demo records back to how the seed creates them, without a Firebase link
export async function resetDemoUsers() {
  for (const [email, name, role] of [
    [DEMO_ADMIN, 'Demo Admin', 'admin'],
    [DEMO_VOLUNTEER, 'Demo Volunteer', 'volunteer'],
  ] as const) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, firebaseUid: null },
      create: { email, name, role },
    });
  }
}
