import { apiFetch } from './api';

export type Cause = 'food' | 'environment' | 'education' | 'community' | 'seniors' | 'animals';

export type Timeframe = 'next7' | 'next30' | 'all';

export type AvailabilityStatus = 'open' | 'filling' | 'full';

export type Availability = {
  capacity: number;
  signedUpCount: number;
  spotsLeft: number;
  status: AvailabilityStatus;
};

export type EventSummary = Availability & {
  id: string;
  title: string;
  cause: Cause;
  date: string;
  startsAt: string;
  endsAt: string;
  location: string;
};

export type EventFilters = {
  q: string;
  cause: Cause | '';
  when: Timeframe;
  openOnly: boolean;
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  next7: 'Next 7 days',
  next30: 'Next 30 days',
  all: 'All upcoming',
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

export function fetchEvents({ q, cause, when, openOnly }: EventFilters) {
  const params = new URLSearchParams({ when });
  if (q.trim()) params.set('q', q.trim());
  if (cause) params.set('cause', cause);
  if (openOnly) params.set('openOnly', 'true');
  return apiFetch<{ events: EventSummary[]; total: number }>(`/api/events?${params}`);
}
