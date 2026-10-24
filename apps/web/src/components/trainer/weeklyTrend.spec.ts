import type { DailyLogView } from '@wizzapp/shared';
import { describe, expect, it } from 'vitest';
import { buildTrend, trendGeometry, trendWeeks } from './weeklyTrend';

function log(logDate: string, weightKg: number | null): DailyLogView {
  return {
    id: logDate,
    logDate,
    weightKg,
    caloriesActual: null,
    carbsGActual: null,
    proteinGActual: null,
    fatGActual: null,
    fiberGActual: null,
    waterLActual: null,
    sleepHours: null,
    stepsActual: null,
    notes: null,
  };
}

describe('trendWeeks', () => {
  it('returns eight weeks ending at the requested one, oldest first', () => {
    const weeks = trendWeeks('2026-W36');

    expect(weeks).toHaveLength(8);
    expect(weeks[7]).toBe('2026-W36');
    expect(weeks[0]).toBe('2026-W29');
  });

  it('crosses a year boundary without gaps', () => {
    const weeks = trendWeeks('2026-W02', 4);

    expect(weeks).toEqual(['2025-W51', '2025-W52', '2026-W01', '2026-W02']);
  });
});

describe('buildTrend', () => {
  it('averages the weights logged in each week', () => {
    // 2026-W36 runs 2026-08-31 to 2026-09-06.
    const points = buildTrend(
      [log('2026-08-31', 82), log('2026-09-02', 81), log('2026-09-06', 80)],
      '2026-W36',
      1,
    );

    expect(points[0].weightKg).toBe(81);
  });

  it('leaves a week with no weigh-in as null rather than zero', () => {
    const points = buildTrend([log('2026-09-02', 82)], '2026-W36', 2);

    expect(points[0].weightKg).toBeNull();
    expect(points[1].weightKg).toBe(82);
  });

  it('ignores logs that recorded no weight', () => {
    const points = buildTrend([log('2026-09-02', null), log('2026-09-03', 80)], '2026-W36', 1);

    expect(points[0].weightKg).toBe(80);
  });

  it('rounds to one decimal', () => {
    const points = buildTrend([log('2026-09-01', 80), log('2026-09-02', 81)], '2026-W36', 1);

    expect(points[0].weightKg).toBe(80.5);
  });

  it('drops logs outside the window', () => {
    const points = buildTrend([log('2026-01-05', 95), log('2026-09-02', 82)], '2026-W36', 2);

    expect(points.map((p) => p.weightKg)).toEqual([null, 82]);
  });

  it('labels each point with a short week tick', () => {
    expect(buildTrend([], '2026-W36', 1)[0].label).toBe('أ36');
  });
});

describe('trendGeometry', () => {
  const points = (weights: (number | null)[]) =>
    weights.map((weightKg, i) => ({ week: `w${i}`, label: `أ${i}`, weightKg }));

  it('plots only the weeks that have a weight', () => {
    const geo = trendGeometry(points([82, null, 80]));

    expect(geo.dots).toHaveLength(2);
  });

  it('still ticks every week on the axis, including empty ones', () => {
    const geo = trendGeometry(points([82, null, 80]));

    expect(geo.ticks).toHaveLength(3);
  });

  it('spans the handoff drawing area', () => {
    const geo = trendGeometry(points([82, 81, 80]));

    expect(geo.dots[0].x).toBe(40);
    expect(geo.dots[geo.dots.length - 1].x).toBe(620);
  });

  it('keeps every point inside the frame', () => {
    const geo = trendGeometry(points([95, 80, 87]));

    for (const dot of geo.dots) {
      expect(dot.y).toBeGreaterThanOrEqual(20);
      expect(dot.y).toBeLessThanOrEqual(185);
    }
  });

  it('draws a heavier weight lower on the chart', () => {
    const geo = trendGeometry(points([90, 80]));

    // y grows downward, so the heavier reading sits at the smaller y.
    expect(geo.dots[0].y).toBeLessThan(geo.dots[1].y);
  });

  it('does not collapse a flat run onto one line', () => {
    // Every week identical — the ±1.5 padding keeps the domain non-zero.
    const geo = trendGeometry(points([80, 80, 80]));

    expect(geo.dots.every((d) => Number.isFinite(d.y))).toBe(true);
    expect(new Set(geo.dots.map((d) => d.y)).size).toBe(1);
  });

  it('produces an empty polyline when nothing was logged', () => {
    const geo = trendGeometry(points([null, null]));

    expect(geo.dots).toEqual([]);
    expect(geo.polyline).toBe('');
  });

  it('emits four grid lines', () => {
    expect(trendGeometry(points([80])).gridYs).toEqual([20, 75, 130, 185]);
  });
});
