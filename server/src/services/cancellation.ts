const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// Cancelling closes once the shift starts in 24 hours or less
export function canCancel(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() > CANCELLATION_WINDOW_MS;
}
