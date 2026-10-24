import { cn } from './cn';
import { num, percent } from '@/lib/format';

/**
 * A segmented progress meter — reads as a gauge on a piece of gym equipment
 * rather than a generic progress bar, and the ticks make "roughly how far"
 * legible at a glance without reading the number.
 */
export function Meter({
  label,
  actual,
  target,
  unit,
  tone = 'blaze',
}: {
  label: string;
  actual: number;
  target: number | null;
  unit?: string;
  tone?: 'blaze' | 'steel' | 'good';
}) {
  const hasTarget = target !== null && target > 0;
  const ratio = hasTarget ? actual / target : 0;
  const filled = Math.max(0, Math.min(ratio, 1));
  const over = hasTarget && ratio > 1.05;

  const fills = {
    blaze: 'bg-blaze',
    steel: 'bg-steel',
    good: 'bg-good',
  } as const;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <span className="tnum text-[13px] font-semibold">
          <span className="text-text">{num(actual)}</span>
          {hasTarget && <span className="text-faint"> / {num(target)}</span>}
          {unit && <span className="text-faint"> {unit}</span>}
        </span>
      </div>

      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-surface-3"
        role="meter"
        aria-valuenow={Math.round(actual)}
        aria-valuemin={0}
        aria-valuemax={hasTarget ? Math.round(target) : undefined}
        aria-label={label}
      >
        {hasTarget && (
          <div
            className={cn('h-full rounded-full transition-[width] duration-500', over ? 'bg-warn' : fills[tone])}
            style={{ width: `${filled * 100}%` }}
          />
        )}
        {/* Quarter ticks, drawn over the fill so they read as gauge markings. */}
        <div className="pointer-events-none absolute inset-0 flex justify-evenly">
          <span className="w-px bg-bg/60" />
          <span className="w-px bg-bg/60" />
          <span className="w-px bg-bg/60" />
        </div>
      </div>

      <p className="text-[12px] text-faint">
        {hasTarget ? (
          over ? (
            <span className="text-warn">تجاوزت الهدف بـ {num(actual - target)} {unit}</span>
          ) : (
            <>متبقٍ {num(Math.max(0, target - actual))} {unit} · {percent(filled)}</>
          )
        ) : (
          'لا يوجد هدف محدد'
        )}
      </p>
    </div>
  );
}
