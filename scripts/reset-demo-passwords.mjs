// Sets each demo account back to the password published in the README, but only when that password
// no longer works: Firebase signs out every session of an account whose password is set, even to
// the same value. Run by .github/workflows/reset-demo.yml, which installs firebase-admin for that
// step only.
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const apiKey = required('FIREBASE_WEB_API_KEY');
const accounts = [
  { email: 'demo.volunteer@example.com', password: required('DEMO_VOLUNTEER_PASSWORD') },
  { email: 'demo.admin@example.com', password: required('DEMO_ADMIN_PASSWORD') },
];

initializeApp({ credential: cert(JSON.parse(required('FIREBASE_SERVICE_ACCOUNT'))) });
const auth = getAuth();

// Firebase's answer for a wrong password: the first code when email enumeration protection is on
const WRONG_PASSWORD = ['INVALID_LOGIN_CREDENTIALS', 'INVALID_PASSWORD'];

// The same sign-in the login page makes; returns Firebase's error code, or null when it works
async function signInError(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (response.ok) return null;
  const body = await response.json().catch(() => null);
  return body?.error?.message ?? `HTTP ${response.status}`;
}

// Each account is handled on its own, so a problem with one doesn't stop the other
for (const { email, password } of accounts) {
  try {
    const error = await signInError(email, password);
    if (error === null) {
      console.log(`${email}: the published password still works, nothing to do`);
      continue;
    }
    if (!WRONG_PASSWORD.includes(error)) throw new Error(`couldn't check the password: ${error}`);

    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password });
    console.log(`${email}: the password had been changed, so it was reset`);
  } catch (error) {
    console.error(`${email}: ${error.message}`);
    process.exitCode = 1;
  }
}
