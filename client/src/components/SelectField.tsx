import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';

type Props = ComponentProps<'select'> & { id: string; label: string; error?: string };

// The <select> twin of TextField: same label, border and error message
export function SelectField({ id, label, error, children, ...selectProps }: Props) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 block min-h-11 w-full rounded-control bg-surface px-3 text-base ${
          error ? 'border-2 border-error-border' : 'border border-input-border'
        }`}
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-error-text">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
