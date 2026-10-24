'use client';

import type { ReactNode } from 'react';
import { cn } from './cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('size-5 animate-spin text-blaze', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <Spinner />
      <span className="text-[14px]">{label}</span>
    </div>
  );
}

/**
 * The state a screen shows before the trainer has set anything up. The API
 * returns 404 for these, but to the client it is simply "not yet" — never
 * an error.
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <h3 className="text-[16px] font-bold text-text">{title}</h3>
      {body && <p className="max-w-[42ch] text-[14px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/30 bg-bad-ghost px-4 py-3">
      <p className="text-[14px] font-medium text-bad">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="micro rounded-lg border border-bad/40 px-3 py-1.5 text-bad transition-colors hover:bg-bad/10"
        >
          RETRY
        </button>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blaze' | 'good' | 'warn' | 'steel';
}) {
  const tones = {
    neutral: 'bg-surface-3 text-muted border-line',
    blaze: 'bg-blaze-ghost text-blaze border-blaze/30',
    good: 'bg-good-ghost text-good border-good/30',
    warn: 'bg-warn-ghost text-warn border-warn/30',
    steel: 'bg-steel-ghost text-steel border-steel/30',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-bold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
