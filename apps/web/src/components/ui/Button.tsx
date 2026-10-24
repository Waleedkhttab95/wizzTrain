'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'blaze' | 'solid' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // The single primary action on a screen. Used sparingly — that's what makes it read.
  blaze:
    'bg-blaze text-accent-ink font-bold hover:bg-blaze-soft active:translate-y-px disabled:bg-blaze-dim disabled:text-accent-ink/60',
  solid:
    'bg-surface-3 text-text hover:bg-line border border-line disabled:text-faint',
  ghost:
    'bg-transparent text-muted hover:text-text hover:bg-surface-2 border border-transparent',
  danger:
    'bg-transparent text-bad border border-bad/30 hover:bg-bad-ghost hover:border-bad/60',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[14px] gap-2 rounded-xl',
  lg: 'h-13 px-7 text-[15px] gap-2 rounded-xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  full = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
