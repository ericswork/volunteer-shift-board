import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/buttons';
import { PageContainer } from '../components/layout/PageContainer';
import { TextField } from '../components/TextField';
import { DEMO_ACCOUNTS } from '../config';
import { useAuth } from '../lib/auth';
import { auth } from '../lib/firebase';
import { authErrorMessage, safeNextPath } from '../lib/login';

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type Pending = 'form' | 'volunteer' | 'admin' | null;

export function LoginPage() {
  const authState = useAuth();
  const [searchParams] = useSearchParams();
  const [pending, setPending] = useState<Pending>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Signing in changes the auth state, and this redirect takes the user on from there
  if (authState.status === 'signed-in') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  }

  async function signIn(email: string, password: string, source: Exclude<Pending, null>) {
    setPending(source);
    setFormError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setFormError(authErrorMessage(error instanceof FirebaseError ? error.code : undefined));
      setPending(null);
    }
  }

  const signInAsDemo = (role: 'volunteer' | 'admin') =>
    signIn(DEMO_ACCOUNTS[role].email, DEMO_ACCOUNTS[role].password, role);
  const busy = pending !== null;

  return (
    <PageContainer>
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-5 sm:p-8">
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em]">Log in</h1>
        <p className="mt-2 text-text-muted">Sign in to sign up for shifts and see your schedule.</p>

        <form
          noValidate
          onSubmit={handleSubmit(({ email, password }) => signIn(email, password, 'form'))}
          className="mt-6 space-y-4"
        >
          <TextField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {formError && (
            <p role="alert" className="font-semibold text-error-text">
              {formError}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} w-full`}>
            {pending === 'form' ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 border-t border-divider pt-6">
          <p className="text-[15px] text-text-muted">Just looking around? Use a demo account:</p>
          <div className="mt-3 grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => signInAsDemo('volunteer')}
              className={SECONDARY_BUTTON}
            >
              {pending === 'volunteer' ? 'Signing in…' : 'Continue as demo volunteer'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => signInAsDemo('admin')}
              className={SECONDARY_BUTTON}
            >
              {pending === 'admin' ? 'Signing in…' : 'Continue as demo admin'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-[15px]">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary-ink underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
