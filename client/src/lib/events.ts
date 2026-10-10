export type Cause = 'food' | 'environment' | 'education' | 'community' | 'seniors' | 'animals';

export type AvailabilityStatus = 'open' | 'filling' | 'full';

export type Availability = {
  capacity: number;
  signedUpCount: number;
  spotsLeft: number;
  status: AvailabilityStatus;
};

export const CAUSE_LABELS: Record<Cause, string> = {
  food: 'Food',
  environment: 'Environment',
  education: 'Education',
  community: 'Community',
  seniors: 'Seniors',
  animals: 'Animals',
};

// A cause the server adds before the client knows it shows its raw value instead of breaking the page
export function causeLabel(cause: string): string {
  return CAUSE_LABELS[cause as Cause] ?? cause;
}
