import { Num } from '@/components/ui/Num';
import { decimal } from '@/lib/format';

/**
 * A progress ring. `rotate(-90)` starts the arc at twelve o'clock, and the
 * dash array is `filled circumference, remainder` — so a 0% ring draws nothing
 * rather than a full circle.
 */
export function Donut({
  size,
  radius,
  stroke,
  percent,
  color,
  trackColor,
  label,
  labelColor,
  labelSize,
}: {
  size: number;
  radius: number;
  stroke: number;
  /** 0-100. Values above 100 are clamped so the ring never overdraws itself. */
  percent: number;
  color: string;
  trackColor: string;
  label: string;
  labelColor: string;
  labelSize: number;
}) {
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(percent, 100)) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ direction: 'ltr' }}
      className="flex-none"
      role="img"
      aria-label={`${Math.round(percent)}%`}
    >
      <circle cx={centre} cy={centre} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={centre}
        cy={centre}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference - filled}`}
        transform={`rotate(-90 ${centre} ${centre})`}
      />
      <text
        x={centre}
        y={centre + labelSize * 0.34}
        textAnchor="middle"
        fontSize={labelSize}
        fontWeight="500"
        fill={labelColor}
        style={{ fontFamily: 'var(--font-num)' }}
      >
        {label}
      </text>
    </svg>
  );
}

/** Share of a target, clamped for display but honest about overshoot in text. */
export function percentOf(have: number | null, goal: number | null): number {
  if (have === null || !goal) return 0;
  return Math.round((have / goal) * 100);
}

export function HaveGoal({ have, goal, unit }: { have: number | null; goal: number | null; unit: string }) {
  // Both sides go through the same formatter, so a four-digit goal doesn't
  // appear without the separator its "have" already has.
  return (
    <Num className="text-[12.5px] text-text-muted">
      {`${decimal(have)} / ${decimal(goal)} ${unit}`.trim()}
    </Num>
  );
}
