import * as usersData from '../data/users.js';
import type { FirebaseIdentity } from '../lib/firebase-token.js';

// Firebase only proves who someone is; their role always comes from our users table
export async function resolveUser({ uid, email, name }: FirebaseIdentity) {
  const linked = await usersData.findUserByFirebaseUid(uid);
  if (linked) return linked;

  const normalizedEmail = email.toLowerCase();
  return usersData.linkOrCreateUser({
    firebaseUid: uid,
    email: normalizedEmail,
    name: name ?? normalizedEmail.split('@')[0]!,
  });
}
