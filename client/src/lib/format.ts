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

// Newer ICU versions put a narrow no-break space before AM/PM; use a plain space everywhere
function normalizeSpaces(text: string): string {
  return text.replace(/ /g, ' ');
}
