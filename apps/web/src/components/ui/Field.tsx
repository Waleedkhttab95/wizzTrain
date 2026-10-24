'use client';

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from './cn';

const CONTROL =
  'w-full rounded-xl border bg-surface-2 px-3.5 py-2.5 text-[15px] text-text ' +
  'transition-colors placeholder:text-faint ' +
  'focus:border-blaze focus:outline-none focus:ring-2 focus:ring-blaze/25 ' +
  'disabled:opacity-50';

function Shell({
  label,
  hint,
  error,
  suffix,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        {suffix && <span className="micro text-faint">{suffix}</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12.5px] font-medium text-bad">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  /** A unit shown beside the label — kg, kcal, g. */
  suffix?: string;
}

export function Field({ label, hint, error, suffix, className, ...rest }: InputProps) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} suffix={suffix} htmlFor={id}>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL,
          error ? 'border-bad' : 'border-line',
          rest.type === 'number' && 'tnum',
          className,
        )}
      />
    </Shell>
  );
}

interface AreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextArea({ label, hint, error, className, ...rest }: AreaProps) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'min-h-[88px] resize-y', error ? 'border-bad' : 'border-line', className)}
      />
    </Shell>
  );
}
