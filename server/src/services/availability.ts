export type AvailabilityStatus = 'open' | 'filling' | 'full';

const FILLING_UP_AT = 0.75;

export function availability(capacity: number, signedUp: number) {
  const spotsLeft = Math.max(capacity - signedUp, 0);
  const status: AvailabilityStatus =
    spotsLeft === 0 ? 'full' : signedUp / capacity >= FILLING_UP_AT ? 'filling' : 'open';
  return { spotsLeft, status };
}
