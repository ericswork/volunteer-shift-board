import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from './api';
import type { Availability, AvailabilityStatus, Cause } from './events';
import { refreshAfterSignupChange, showServerError } from './signups';

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

export type RosterSignup = { signupId: string; name: string; initials: string; signedUpAt: string };

export type Roster = Availability & {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  signups: RosterSignup[];
};

export function fetchRoster(shiftId: string) {
  return apiFetch<Roster>(`/api/admin/shifts/${encodeURIComponent(shiftId)}/roster`);
}

export function useRemoveSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signup: { signupId: string; name: string; shiftName: string }) =>
      apiFetch(`/api/admin/signups/${signup.signupId}`, { method: 'DELETE' }),
    onSuccess: (_, signup) => toast.success(`Removed ${signup.name} from ${signup.shiftName}.`),
    onError: showServerError,
    onSettled: () =>
      Promise.all([
        refreshAfterSignupChange(queryClient),
        queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
        queryClient.invalidateQueries({ queryKey: ['roster'] }),
      ]),
  });
}
