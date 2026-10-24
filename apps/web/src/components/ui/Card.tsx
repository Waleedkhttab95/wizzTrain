import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Not everything is a card — this is for genuinely separable objects.
 * `raised` lifts the one thing on a screen that deserves emphasis.
 */
export function Card({
  children,
  className,
  raised = false,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'rounded-[10px] border bg-surface',
        raised ? 'border-line' : 'border-line-soft',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHead({
  title,
  label,
  action,
  className,
}: {
  title: ReactNode;
  label?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        {label && <p className="micro mb-1.5 text-faint">{label}</p>}
        <h2 className="truncate text-[15px] font-bold text-text">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
