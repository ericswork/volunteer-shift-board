import * as eventsData from '../data/events.js';
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
