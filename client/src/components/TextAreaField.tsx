import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';

type Props = ComponentProps<'textarea'> & { id: string; label: string; error?: string };

// The <textarea> twin of TextField: same label, border and error message
export function TextAreaField({ id, label, error, ...textareaProps }: Props) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 block w-full rounded-control bg-surface px-3 py-2.5 text-base ${
          error ? 'border-2 border-error-border' : 'border border-input-border'
        }`}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-error-text">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
