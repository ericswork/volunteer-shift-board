import { z } from 'zod';
import * as eventsData from '../data/events.js';
import * as signupsData from '../data/signups.js';
import { getEnv } from '../config/env.js';
import { notFound, validationError } from '../lib/errors.js';
import { initials } from '../lib/initials.js';
import { appToday, zonedTimeToUtc } from '../lib/time.js';
import type { CreateShiftBody } from '../schemas/admin.js';
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

export async function createShift(
  eventId: string,
  { name, startTime, endTime, capacity }: CreateShiftBody,
) {
  const event = z.uuid().safeParse(eventId).success ? await eventsData.findEventDate(eventId) : null;
  if (!event) throw notFound("We couldn't find that event.");

  const date = event.date.toISOString().slice(0, 10);
  if (date < appToday()) {
    throw validationError([
      { path: 'eventId', message: 'Shifts can only be added to upcoming events.' },
    ]);
  }

  const timeZone = getEnv().APP_TIMEZONE;
  const shift = await eventsData.createShift({
    eventId,
    name,
    startsAt: zonedTimeToUtc(date, startTime, timeZone),
    endsAt: zonedTimeToUtc(date, endTime, timeZone),
    capacity,
  });
  return {
    id: shift.id,
    name: shift.name,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    capacity: shift.capacity,
  };
}
