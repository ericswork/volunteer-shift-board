import { z } from 'zod';
import * as signupsData from '../data/signups.js';
import { prisma } from '../db/client.js';
import { Prisma } from '../generated/prisma/client.js';
import * as clock from '../lib/clock.js';
import { conflict, notFound } from '../lib/errors.js';
import { availability } from './availability.js';

const shiftNotFound = () => notFound("We couldn't find that shift.");
const alreadySignedUp = () => conflict('ALREADY_SIGNED_UP', "You're already signed up for this shift.");

// Locks the user, then the shift (always in that order, so two requests never wait on each other
// in a circle), then checks the rules on data no other sign-up can change until this commits
export async function signUp(userId: string, shiftId: string) {
  if (!z.uuid().safeParse(shiftId).success) throw shiftNotFound();

  try {
    return await prisma.$transaction(
      async (tx) => {
        await signupsData.lockUser(tx, userId);
        const shift = await signupsData.lockShift(tx, shiftId);
        if (!shift) throw shiftNotFound();
        if (shift.startsAt <= clock.now()) {
          throw conflict('SHIFT_STARTED', 'This shift has already started.');
        }
        if (await signupsData.findSignup(tx, userId, shiftId)) throw alreadySignedUp();

        const taken = await signupsData.countSignups(tx, shiftId);
        if (taken >= shift.capacity) throw conflict('SHIFT_FULL', 'This shift just filled up.');
        if (await signupsData.findOverlappingSignup(tx, userId, shift)) {
          throw conflict('SHIFT_OVERLAP', "This shift overlaps another shift you've signed up for.");
        }

        const signup = await signupsData.createSignup(tx, userId, shiftId);
        const signedUpCount = taken + 1;
        return {
          id: signup.id,
          shift: {
            id: shiftId,
            capacity: shift.capacity,
            signedUpCount,
            ...availability(shift.capacity, signedUpCount),
          },
        };
      },
      // Long enough to survive a Neon wake-up, and to queue behind a burst of other sign-ups
      { maxWait: 10_000, timeout: 10_000 },
    );
  } catch (error) {
    // The unique (user, shift) constraint is the backstop if the check above is ever bypassed
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw alreadySignedUp();
    }
    throw error;
  }
}
