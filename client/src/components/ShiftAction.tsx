import { Check } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { Shift } from '../lib/events';
import { useSignUp } from '../lib/signups';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './buttons';
import { CancelSignupDialog } from './CancelSignupDialog';

const DISABLED_LABELS = {
  full: 'Shift full',
  overlap: 'Overlaps your shift',
  started: 'Sign-ups closed',
} as const;

function DisabledAction({ label }: { label: string }) {
  return (
    <button type="button" disabled className={`${SECONDARY_BUTTON} w-full`}>
      {label}
    </button>
  );
}

// The server decides the viewer's state; this only picks the matching control
export function ShiftAction({ shift }: { shift: Shift }) {
  const { pathname } = useLocation();
  const signUp = useSignUp();
  const viewer = shift.viewer;

  // Visitors get no viewer state; signing in brings them back here without signing them up
  if (!viewer) {
    if (shift.status === 'full') return <DisabledAction label="Shift full" />;
    return (
      <Link to={`/login?next=${encodeURIComponent(pathname)}`} className={`${PRIMARY_BUTTON} w-full`}>
        Sign up<span className="sr-only"> for {shift.name}</span>
      </Link>
    );
  }

  if (viewer.state === 'signed_up') {
    return (
      <div className="space-y-2">
        <p className="flex items-center justify-center gap-2 font-semibold text-primary-ink md:justify-start">
          <Check aria-hidden className="size-5" />
          You're signed up
        </p>
        {viewer.canCancel ? (
          <CancelSignupDialog
            signupId={viewer.signupId}
            shiftName={shift.name}
            startsAt={shift.startsAt}
            className="w-full"
          />
        ) : (
          <p className="text-center text-[15px] text-text-muted md:text-left">Cancellation closed</p>
        )}
      </div>
    );
  }

  if (viewer.state !== 'open') return <DisabledAction label={DISABLED_LABELS[viewer.state]} />;

  return (
    <button
      type="button"
      disabled={signUp.isPending}
      onClick={() => signUp.mutate({ id: shift.id, name: shift.name })}
      className={`${PRIMARY_BUTTON} w-full`}
    >
      {signUp.isPending ? 'Signing up…' : 'Sign up'}
      <span className="sr-only"> for {shift.name}</span>
    </button>
  );
}
