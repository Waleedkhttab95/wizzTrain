import type { DailyLogView } from '@wizzapp/shared';
import { isoWeekOf, shiftIsoWeek } from '@/lib/format';

/**
 * The chart in the handoff plots weight across the **last 8 weeks**, but the
 * summary endpoint only reports the week you asked for. Rather than firing
 * eight requests, the screen pulls the raw daily logs once and averages them
 * per ISO week here.
 */
export const TREND_WEEKS = 8;

export interface TrendPoint {
  /** ISO week, e.g. `2026-W36`. */
  week: string;
  /** Short label under the dot, e.g. `أ36`. */
  label: string;
  /** Mean of the weights logged that week, or null when none were. */
  weightKg: number | null;
}

/** The eight ISO weeks ending at `endWeek`, oldest first. */
export function trendWeeks(endWeek: string, count = TREND_WEEKS): string[] {
  const weeks: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    weeks.push(shiftIsoWeek(endWeek, -offset));
  }
  return weeks;
}

/**
 * Averages the logged weights into one point per week.
 *
 * Weeks with no weigh-in stay `null` rather than collapsing to zero — the
 * chart skips them instead of drawing a dive to the floor.
 */
export function buildTrend(logs: DailyLogView[], endWeek: string, count = TREND_WEEKS): TrendPoint[] {
  const buckets = new Map<string, number[]>();

  for (const log of logs) {
    if (log.weightKg === null) continue;
    const week = isoWeekOf(log.logDate);
    const bucket = buckets.get(week);
    if (bucket) bucket.push(log.weightKg);
    else buckets.set(week, [log.weightKg]);
  }

  return trendWeeks(endWeek, count).map((week) => {
    const values = buckets.get(week);
    const mean =
      values && values.length > 0
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
        : null;
    return { week, label: weekTick(week), weightKg: mean };
  });
}

/** `2026-W36` → `أ36`, short enough to sit under a dot without colliding. */
function weekTick(week: string): string {
  const match = /^\d{4}-W(\d{2})$/.exec(week);
  return match ? `أ${Number(match[1])}` : week;
}

export interface TrendGeometry {
  /** Points that actually have a weight, with their pixel coordinates. */
  dots: { x: number; y: number; value: number; label: string }[];
  /** All eight ticks, so empty weeks still get a label on the axis. */
  ticks: { x: number; label: string }[];
  polyline: string;
  gridYs: number[];
}

/**
 * Lays the trend out in the handoff's 640×240 viewBox. The y-domain is
 * min−1.5 … max+1.5 kg, which keeps a flat run from filling the whole frame.
 */
export function trendGeometry(points: TrendPoint[]): TrendGeometry {
  const LEFT = 40;
  const RIGHT = 620;
  const TOP = 20;
  const HEIGHT = 165;

  const span = RIGHT - LEFT;
  const step = points.length > 1 ? span / (points.length - 1) : 0;
  const x = (index: number) => Math.round(LEFT + index * step);

  const weights = points
    .map((point) => point.weightKg)
    .filter((value): value is number => value !== null);

  const min = weights.length > 0 ? Math.min(...weights) - 1.5 : 0;
  const max = weights.length > 0 ? Math.max(...weights) + 1.5 : 1;
  const range = max - min || 1;
  const y = (value: number) => Math.round(TOP + ((max - value) / range) * HEIGHT);

  const dots = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.weightKg !== null)
    .map(({ point, index }) => ({
      x: x(index),
      y: y(point.weightKg as number),
      value: point.weightKg as number,
      label: point.label,
    }));

  return {
    dots,
    ticks: points.map((point, index) => ({ x: x(index), label: point.label })),
    polyline: dots.map((dot) => `${dot.x},${dot.y}`).join(' '),
    // Four evenly spaced rules, matching the prototype.
    gridYs: [20, 75, 130, 185],
  };
}
