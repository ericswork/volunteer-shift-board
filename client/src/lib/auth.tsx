import { useQuery } from '@tanstack/react-query';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import { auth } from './firebase';
import { useServerReady } from './server-health';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

export type Me = {
  id: string;
  name: string;
  email: string;
  role: 'volunteer' | 'admin';
  initials: string;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Also fires when a token refreshes, so a renamed account shows its new name
  useEffect(
    () =>
      onIdTokenChanged(auth, (user) => {
        setState(user ? { status: 'signed-in', user } : { status: 'signed-out' });
      }),
    [],
  );

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

// The role and initials come from our API, never from Firebase
export function useMe() {
  const authState = useAuth();
  const serverReady = useServerReady();
  const uid = authState.status === 'signed-in' ? authState.user.uid : null;

  return useQuery({
    queryKey: ['me', uid],
    queryFn: () => apiFetch<Me>('/api/me'),
    enabled: uid !== null && serverReady,
  });
}
