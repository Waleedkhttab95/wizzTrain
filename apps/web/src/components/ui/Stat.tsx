import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * A single headline figure. Reserved for numbers that are genuinely the point
 * of the block — otherwise a label/value row does the job with less weight.
 */
export function Stat({
  label,
  value,
  unit,
  delta,
  tone = 'text',
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: ReactNode;
  tone?: 'text' | 'blaze' | 'steel' | 'good' | 'bad' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}) {
  const tones = {
    text: 'text-text',
    blaze: 'text-blaze',
    steel: 'text-steel',
    good: 'text-good',
    bad: 'text-bad',
    muted: 'text-muted',
  } as const;

  const sizes = {
    sm: 'text-[26px]',
    md: 'text-[34px]',
    lg: 'text-[46px]',
  } as const;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="micro text-faint">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('stat-num', sizes[size], tones[tone])}>{value}</span>
        {unit && <span className="text-[13px] font-semibold text-faint">{unit}</span>}
        {delta && <span className="ms-1 text-[13px] font-semibold">{delta}</span>}
      </div>
    </div>
  );
}

/** Signed change, coloured by direction with an explicit meaning of "good". */
export function Delta({
  value,
  goodWhen = 'down',
  unit,
}: {
  value: number | null;
  goodWhen?: 'up' | 'down';
  unit?: string;
}) {
  if (value === null || !Number.isFinite(value) || value === 0) {
    return <span className="text-faint">—</span>;
  }
  const rising = value > 0;
  const good = goodWhen === 'up' ? rising : !rising;
  return (
    <span className={cn('tnum', good ? 'text-good' : 'text-warn')}>
      {rising ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
      {unit ? ` ${unit}` : ''}
    </span>
  );
}
