import { z } from 'zod';
import * as eventsData from '../data/events.js';
import { notFound } from '../lib/errors.js';
import { appToday, timeframeDates } from '../lib/time.js';
import type { ListEventsQuery } from '../schemas/events.js';
import { availability } from './availability.js';

type EventRow = NonNullable<Awaited<ReturnType<typeof eventsData.findEventById>>>;
type ShiftRow = EventRow['shifts'][number];
type EventDetail = ReturnType<typeof toEventDetail>;

export async function listEvents({ q, cause, when, openOnly }: ListEventsQuery) {
  const { from, to } = timeframeDates(when, appToday());
  const rows = await eventsData.findEvents({ from, to, cause, q });

  const events = rows
    .map(toEventDetail)
    .filter((event) => !openOnly || event.shifts.some((shift) => shift.spotsLeft > 0))
    .sort(soonestFirst)
    .map(({ description: _description, shifts: _shifts, ...summary }) => summary);

  return { events, total: events.length };
}

export async function getEvent(id: string) {
  // A mangled link is the same as a missing event to a visitor, and Postgres would reject the non-uuid
  const row = z.uuid().safeParse(id).success ? await eventsData.findEventById(id) : null;
  if (!row) throw notFound("We couldn't find that event.");
  return toEventDetail(row);
}

function toEventDetail(row: EventRow) {
  const shifts = row.shifts.map(toShift);
  const capacity = shifts.reduce((total, shift) => total + shift.capacity, 0);
  const signedUpCount = shifts.reduce((total, shift) => total + shift.signedUpCount, 0);

  return {
    id: row.id,
    title: row.title,
    cause: row.cause,
    date: row.date.toISOString().slice(0, 10),
    ...timeSpan(shifts),
    location: row.location,
    capacity,
    signedUpCount,
    ...availability(capacity, signedUpCount),
    description: row.description,
    shifts,
  };
}

function toShift(row: ShiftRow) {
  const signedUpCount = row._count.signups;
  return {
    id: row.id,
    name: row.name,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    capacity: row.capacity,
    signedUpCount,
    ...availability(row.capacity, signedUpCount),
  };
}

// Admins create an event before adding its shifts, so a direct link can reach one with none
function timeSpan(shifts: { startsAt: Date; endsAt: Date }[]) {
  if (shifts.length === 0) return { startsAt: null, endsAt: null };
  return {
    startsAt: new Date(Math.min(...shifts.map((shift) => shift.startsAt.getTime()))),
    endsAt: new Date(Math.max(...shifts.map((shift) => shift.endsAt.getTime()))),
  };
}

// Only events with shifts are listed, so startsAt is always set here
function soonestFirst(a: EventDetail, b: EventDetail) {
  return a.date.localeCompare(b.date) || a.startsAt!.getTime() - b.startsAt!.getTime();
}
