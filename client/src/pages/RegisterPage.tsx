import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { PRIMARY_BUTTON } from '../components/buttons';
import { PageContainer } from '../components/layout/PageContainer';
import { TextField } from '../components/TextField';
import { useAuth } from '../lib/auth';
import { auth } from '../lib/firebase';
import { safeNextPath } from '../lib/login';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80, 'Use 80 characters or fewer.'),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

export function RegisterPage() {
  const authState = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  if (authState.status === 'signed-in') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  }

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      // The header may already have asked /api/me before the name existed; a fresh token carries
      // the name, and refetching lets the server store it
      await user.getIdToken(true);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : undefined;
      if (code === 'auth/email-already-in-use') {
        setError('email', { message: 'An account with this email already exists.' });
      } else {
        setFormError("We couldn't create your account. Please try again.");
      }
    }
  });

  return (
    <PageContainer>
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-5 sm:p-8">
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em]">Create an account</h1>
        <p className="mt-2 text-text-muted">Sign up as a volunteer to claim shifts.</p>

        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
          <TextField
            id="register-name"
            label="Name"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {formError && (
            <p role="alert" className="font-semibold text-error-text">
              {formError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className={`${PRIMARY_BUTTON} w-full`}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-[15px]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
