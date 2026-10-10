import { CircleAlert } from 'lucide-react';
import { SECONDARY_BUTTON } from './buttons';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-error-border bg-surface px-6 py-12 text-center">
      <CircleAlert aria-hidden className="mx-auto size-7 text-error-text" />
      <p className="mt-3 text-lg font-semibold text-error-text">{message}</p>
      <button type="button" onClick={onRetry} className={`${SECONDARY_BUTTON} mt-5`}>
        Try again
      </button>
    </div>
  );
}
