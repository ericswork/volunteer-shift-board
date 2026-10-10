import * as usersData from '../data/users.js';
import type { FirebaseIdentity } from '../lib/firebase-token.js';

// Firebase only proves who someone is; their role always comes from our users table
export async function resolveUser({ uid, email, name }: FirebaseIdentity) {
  const linked = await usersData.findUserByFirebaseUid(uid);
  if (linked) {
    // Registration sets the display name just after creating the account, so the first request
    // can arrive without it; a later token carrying the name corrects the record
    if (name && name !== linked.name) return usersData.updateUserName(linked.id, name);
    return linked;
  }

  const normalizedEmail = email.toLowerCase();
  return usersData.linkOrCreateUser({
    firebaseUid: uid,
    email: normalizedEmail,
    name: name ?? normalizedEmail.split('@')[0]!,
  });
}
