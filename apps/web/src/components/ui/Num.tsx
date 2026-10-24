import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from './cn';

/**
 * Isolates a run that mixes digits with Arabic text.
 *
 * Without this, bidi reordering scrambles anything like `95.0 كجم`,
 * `-0.4 من أمس`, `158 / 170 g` or `10/9/9` — the digits and the sign end up on
 * the wrong side of the unit. The handoff flags this as a real bug source, so
 * every mixed run in the app goes through here rather than relying on each
 * caller to remember a `dir` attribute.
 *
 * Numerals stay Western (0-9) throughout the product.
 */
export function Num({
  children,
  className,
  as: Tag = 'span',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p';
  // Callers pass through ARIA — a stepper's value needs aria-live so the new
  // number is announced when it changes in place.
} & Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className' | 'dir'>) {
  return (
    <Tag {...rest} dir="ltr" className={cn('inline-block tnum [unicode-bidi:isolate]', className)}>
      {children}
    </Tag>
  );
}

/** Western numerals with thousands separators — never Eastern-Arabic digits. */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits });
}
