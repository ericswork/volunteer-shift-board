import { prisma } from '../db/client.js';

export function findUserByFirebaseUid(firebaseUid: string, db = prisma) {
  return db.user.findUnique({ where: { firebaseUid } });
}

export function updateUserName(id: string, name: string, db = prisma) {
  return db.user.update({ where: { id }, data: { name } });
}

// Prisma runs this as one INSERT … ON CONFLICT (email), so simultaneous first requests can't
// create two records for the same person
export function linkOrCreateUser(
  { firebaseUid, email, name }: { firebaseUid: string; email: string; name: string },
  db = prisma,
) {
  return db.user.upsert({
    where: { email },
    update: { firebaseUid },
    create: { firebaseUid, email, name, role: 'volunteer' },
  });
}
