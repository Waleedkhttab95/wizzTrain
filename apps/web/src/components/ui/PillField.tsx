'use client';

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from './cn';

/**
 * The handoff's form field: a 48px pill input under an inline label.
 * `latin` flips the field to LTR for values that are never Arabic — email,
 * password, phone — so the caret and text start on the correct side.
 */
const BASE =
  'rounded-full border bg-input-bg text-text transition-colors ' +
  'placeholder:text-placeholder focus:border-accent focus:outline-none';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'size'> {
  label: string;
  hint?: string;
  error?: string;
  latin?: boolean;
  /** Taller, larger type — the handoff uses 56px for the goal-weight field. */
  size?: 'md' | 'lg';
}

export function PillField({
  label,
  hint,
  error,
  latin = false,
  size = 'md',
  className,
  ...rest
}: FieldProps) {
  const id = useId();
  const numeric = rest.type === 'number';

  return (
    <div className="flex min-w-0 flex-col gap-[7px]">
      <label htmlFor={id} className="text-[14px] font-semibold">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        dir={latin ? 'ltr' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        className={cn(
          BASE,
          size === 'lg' ? 'h-14 px-5 text-[22px] font-bold' : 'h-12 px-[18px] text-[15px]',
          numeric && 'tnum font-semibold',
          numeric && size === 'md' && 'text-[17px]',
          latin && 'text-start',
          error ? 'border-bad' : 'border-border',
          className,
        )}
      />
      {(error || hint) && (
        <p
          id={`${id}-note`}
          className={cn('text-[12.5px]', error ? 'font-medium text-bad' : 'text-text-faint')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

interface AreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function PillTextArea({ label, hint, error, className, ...rest }: AreaProps) {
  const id = useId();

  return (
    <div className="flex min-w-0 flex-col gap-[7px]">
      <label htmlFor={id} className="text-[14px] font-semibold">
        {label}
      </label>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          BASE,
          'resize-y rounded-[14px] px-[18px] py-3.5 text-[15px] leading-relaxed',
          error ? 'border-bad' : 'border-border',
          className,
        )}
      />
      {(error || hint) && (
        <p className={cn('text-[12.5px]', error ? 'font-medium text-bad' : 'text-text-faint')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** The handoff's primary CTA: an orange pill in Tajawal. */
export function PrimaryPill({
  children,
  className,
  ...rest
}: InputHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cn(
        'flex h-13 items-center justify-center rounded-full bg-accent px-7',
        'font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink',
        'transition-colors duration-150 hover:bg-accent-hover',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** The matching ghost button — hairline border, subtle hover. */
export function GhostPill({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'flex h-12 items-center justify-center rounded-full border border-[rgba(255,255,255,.16)]',
        'px-[22px] text-[15px] font-semibold transition-colors duration-150',
        'hover:bg-[rgba(255,255,255,.07)] disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}
