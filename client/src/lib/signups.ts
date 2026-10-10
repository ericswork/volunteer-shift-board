import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from './api';

// Sign-ups change counts on the list, the event page and My shifts, so all three refetch
function refreshAfterSignupChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['event'] }),
    queryClient.invalidateQueries({ queryKey: ['events'] }),
    queryClient.invalidateQueries({ queryKey: ['my-signups'] }),
  ]);
}

// A 409 means the page was out of date (the shift filled, the window closed): say why and refresh
function showServerError(error: Error) {
  toast.error(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
}

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shift: { id: string; name: string }) =>
      apiFetch(`/api/shifts/${shift.id}/signup`, { method: 'POST' }),
    onSuccess: (_, shift) => toast.success(`You're signed up for ${shift.name}.`),
    onError: showServerError,
    onSettled: () => refreshAfterSignupChange(queryClient),
  });
}

export function useCancelSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signup: { signupId: string; shiftName: string }) =>
      apiFetch(`/api/signups/${signup.signupId}`, { method: 'DELETE' }),
    onSuccess: (_, signup) => toast.success(`Your ${signup.shiftName} sign-up was cancelled.`),
    onError: showServerError,
    onSettled: () => refreshAfterSignupChange(queryClient),
  });
}
