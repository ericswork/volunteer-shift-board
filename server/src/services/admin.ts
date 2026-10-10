import { z } from 'zod';
import * as eventsData from '../data/events.js';
import * as signupsData from '../data/signups.js';
import { notFound } from '../lib/errors.js';
import { initials } from '../lib/initials.js';
import { appToday } from '../lib/time.js';
import { availability } from './availability.js';

export async function listAdminEvents() {
  const rows = await eventsData.findEventsFrom(appToday());
  const events = rows.map((row) => {
    const capacity = row.shifts.reduce((total, shift) => total + shift.capacity, 0);
    const signedUpCount = row.shifts.reduce((total, shift) => total + shift._count.signups, 0);
    return {
      id: row.id,
      title: row.title,
      cause: row.cause,
      date: row.date.toISOString().slice(0, 10),
      shiftCount: row.shifts.length,
      signedUpCount,
      capacity,
      // "Full" would be misleading for an event nobody can sign up for yet
      status: row.shifts.length === 0 ? null : availability(capacity, signedUpCount).status,
    };
  });
  return { events };
}

export async function getRoster(shiftId: string) {
  const shift = z.uuid().safeParse(shiftId).success
    ? await signupsData.findShiftWithRoster(shiftId)
    : null;
  if (!shift) throw notFound("We couldn't find that shift.");

  const signedUpCount = shift.signups.length;
  return {
    id: shift.id,
    name: shift.name,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    capacity: shift.capacity,
    signedUpCount,
    ...availability(shift.capacity, signedUpCount),
    signups: shift.signups.map((signup) => ({
      signupId: signup.id,
      name: signup.user.name,
      initials: initials(signup.user.name),
      signedUpAt: signup.createdAt,
    })),
  };
}

// Admins aren't bound by the 24-hour window, and removing can only free a spot, so no lock
export async function removeSignup(signupId: string) {
  const removed = z.uuid().safeParse(signupId).success && (await signupsData.deleteSignup(signupId));
  if (!removed) throw notFound('That sign-up no longer exists.');
}
