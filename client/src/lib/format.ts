import { APP_TIMEZONE } from '../config';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const dateFormat = (timeZone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric' });

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
});

// Accepts an ISO instant or a 'YYYY-MM-DD' calendar date, and prints "Sat, Oct 17"
export function formatDate(value: string): string {
  // Calendar dates have no time zone; reading them as UTC keeps the day from shifting
  if (CALENDAR_DATE.test(value)) return dateFormat('UTC').format(new Date(`${value}T00:00:00Z`));
  return dateFormat(APP_TIMEZONE).format(new Date(value));
}

export function formatTime(instant: string): string {
  return normalizeSpaces(timeFormat.format(new Date(instant)));
}

const dateBlockFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  weekday: 'short',
  day: 'numeric',
});

// The calendar tile on My shifts: { weekday: "SAT", day: "17" } in the app time zone
export function dateBlock(instant: string): { weekday: string; day: string } {
  const parts = dateBlockFormat.formatToParts(new Date(instant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { weekday: part('weekday').toUpperCase(), day: part('day') };
}

// "8:00 – 11:00 AM" when both ends share AM/PM, otherwise "10:30 AM – 12:00 PM"
export function formatTimeRange(startsAt: string, endsAt: string): string {
  const start = formatTime(startsAt);
  const end = formatTime(endsAt);
  const [startClock, startPeriod] = start.split(' ');
  const [, endPeriod] = end.split(' ');
  return startPeriod === endPeriod ? `${startClock} – ${end}` : `${start} – ${end}`;
}

export function spotsLabel({
  capacity,
  signedUpCount,
  spotsLeft,
}: {
  capacity: number;
  signedUpCount: number;
  spotsLeft: number;
}): string {
  if (spotsLeft === 0) return `Full · ${signedUpCount} of ${capacity} taken`;
  return `${spotsLeft} of ${capacity} spots left`;
}

// Newer ICU versions put a narrow no-break space before AM/PM; use a plain space everywhere
function normalizeSpaces(text: string): string {
  return text.replace(/ /g, ' ');
}
