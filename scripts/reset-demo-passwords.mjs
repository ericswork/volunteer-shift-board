// Sets both demo accounts back to the passwords published in the README, in case a reviewer changed
// one. Run by .github/workflows/reset-demo.yml, which installs firebase-admin for that step only.
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const accounts = [
  { email: 'demo.volunteer@example.com', password: required('DEMO_VOLUNTEER_PASSWORD') },
  { email: 'demo.admin@example.com', password: required('DEMO_ADMIN_PASSWORD') },
];

initializeApp({ credential: cert(JSON.parse(required('FIREBASE_SERVICE_ACCOUNT'))) });
const auth = getAuth();

for (const { email, password } of accounts) {
  const user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password });
  console.log(`Reset the password of ${email}`);
}
