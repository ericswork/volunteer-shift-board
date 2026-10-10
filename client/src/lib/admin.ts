import { apiFetch } from './api';
import type { AvailabilityStatus, Cause } from './events';

export type AdminEvent = {
  id: string;
  title: string;
  cause: Cause;
  date: string;
  shiftCount: number;
  signedUpCount: number;
  capacity: number;
  status: AvailabilityStatus | null;
};

export function fetchAdminEvents() {
  return apiFetch<{ events: AdminEvent[] }>('/api/admin/events');
}
