import { parseIsoDate, parseIsoWeek } from '../common/utils/date.util';
import {
  computeWeeklySummary,
  type DailyMetrics,
  type WeeklyInputs,
  type WeeklyTargets,
} from './weekly-summary.calculator';

const RANGE = parseIsoWeek('2026-W35'); // 2026-08-24 (Mon) → 2026-08-30 (Sun)

const TARGETS: WeeklyTargets = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 60,
  fiberMinG: 30,
  waterMinL: 3,
  stepsMin: 8000,
};

function day(date: string, values: Partial<Omit<DailyMetrics, 'logDate'>> = {}): DailyMetrics {
  return {
    logDate: parseIsoDate(date),
    weightKg: null,
    caloriesActual: null,
    carbsGActual: null,
    proteinGActual: null,
    fatGActual: null,
    fiberGActual: null,
    waterLActual: null,
    sleepHours: null,
    stepsActual: null,
    ...values,
  };
}

function inputs(overrides: Partial<WeeklyInputs> = {}): WeeklyInputs {
  return {
    range: RANGE,
    logs: [],
    targets: TARGETS,
    adherence: { planned: 0, logged: 0 },
    adherenceDays: [],
    previous: { logs: [], adherence: { planned: 0, logged: 0 } },
    ...overrides,
  };
}

describe('computeWeeklySummary', () => {
  it('reports the week boundaries the trainer asked for', () => {
    const summary = computeWeeklySummary(inputs());

    expect(summary.week).toBe('2026-W35');
    expect(summary.weekStart).toBe('2026-08-24');
    expect(summary.weekEnd).toBe('2026-08-30');
  });

  describe('with no logs at all', () => {
    const summary = computeWeeklySummary(inputs());

    it('reports zero days logged', () => {
      expect(summary.daysLogged).toBe(0);
    });

    it('returns null averages rather than zero, so the UI can say "no data"', () => {
      expect(summary.averageWeightKg).toBeNull();
      expect(summary.averageSleepHours).toBeNull();
      expect(summary.nutrition.calories.dailyAverage).toBeNull();
      expect(summary.weightChangeKg).toBeNull();
    });

    it('still shows the full weekly target as remaining', () => {
      expect(summary.nutrition.calories.actual).toBe(0);
      expect(summary.nutrition.calories.target).toBe(14_000);
      expect(summary.nutrition.calories.remaining).toBe(14_000);
    });
  });

  describe('nutrition totals', () => {
    it('sums logged values and subtracts them from the 7-day target', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [
            day('2026-08-24', { caloriesActual: 1800, proteinGActual: 140 }),
            day('2026-08-25', { caloriesActual: 2200, proteinGActual: 160 }),
            day('2026-08-26', { caloriesActual: 2000, proteinGActual: 150 }),
          ],
        }),
      );

      expect(summary.daysLogged).toBe(3);
      expect(summary.nutrition.calories.actual).toBe(6000);
      expect(summary.nutrition.calories.target).toBe(14_000);
      expect(summary.nutrition.calories.remaining).toBe(8000);
      expect(summary.nutrition.protein.actual).toBe(450);
    });

    it('averages over the days that carry a value, not over all 7', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [
            day('2026-08-24', { caloriesActual: 1800 }),
            day('2026-08-25', { caloriesActual: 2200 }),
            // Logged the day, but left calories blank — must not drag the
            // average down as if it were a 0-calorie day.
            day('2026-08-26', { weightKg: 80 }),
          ],
        }),
      );

      expect(summary.nutrition.calories.dailyAverage).toBe(2000);
    });

    it('floors remaining at zero once the client is over target', () => {
      const summary = computeWeeklySummary(
        inputs({ logs: [day('2026-08-24', { caloriesActual: 20_000 })] }),
      );

      expect(summary.nutrition.calories.actual).toBe(20_000);
      expect(summary.nutrition.calories.remaining).toBe(0);
    });

    it('returns null targets when the client has no active nutrition plan', () => {
      const summary = computeWeeklySummary(
        inputs({ targets: null, logs: [day('2026-08-24', { caloriesActual: 1800 })] }),
      );

      expect(summary.nutrition.calories.actual).toBe(1800);
      expect(summary.nutrition.calories.target).toBeNull();
      expect(summary.nutrition.calories.remaining).toBeNull();
    });

    it('treats an optional target left unset on the plan as no target', () => {
      const summary = computeWeeklySummary(
        inputs({ targets: { ...TARGETS, fiberMinG: null, stepsMin: null } }),
      );

      expect(summary.nutrition.fiber.target).toBeNull();
      expect(summary.nutrition.steps.target).toBeNull();
      expect(summary.nutrition.waterL.target).toBe(21);
    });
  });

  describe('weight trend', () => {
    it('orders points by date and reports the net change across the week', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [
            day('2026-08-26', { weightKg: 80.5 }),
            day('2026-08-24', { weightKg: 81.2 }),
            day('2026-08-29', { weightKg: 79.9 }),
          ],
        }),
      );

      expect(summary.weightTrend.map((point) => point.date)).toEqual([
        '2026-08-24',
        '2026-08-26',
        '2026-08-29',
      ]);
      expect(summary.weightChangeKg).toBe(-1.3);
      expect(summary.averageWeightKg).toBe(80.53); // (81.2 + 80.5 + 79.9) / 3
    });

    it('skips days with no weight entry', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [day('2026-08-24', { weightKg: 80 }), day('2026-08-25', { caloriesActual: 1800 })],
        }),
      );

      expect(summary.weightTrend).toHaveLength(1);
    });

    it('reports no change from a single weigh-in', () => {
      const summary = computeWeeklySummary(inputs({ logs: [day('2026-08-24', { weightKg: 80 })] }));

      expect(summary.weightChangeKg).toBeNull();
      expect(summary.averageWeightKg).toBe(80);
    });
  });

  describe('workout adherence', () => {
    it('is the logged share of what was planned', () => {
      const summary = computeWeeklySummary(inputs({ adherence: { planned: 12, logged: 9 } }));

      expect(summary.adherence).toMatchObject({ planned: 12, logged: 9, rate: 0.75 });
    });

    it('is null when nothing was planned, so 0% is not shown for "no program"', () => {
      const summary = computeWeeklySummary(inputs({ adherence: { planned: 0, logged: 0 } }));

      expect(summary.adherence.rate).toBeNull();
    });

    it('caps at 100% when the client logs more than was planned', () => {
      const summary = computeWeeklySummary(inputs({ adherence: { planned: 4, logged: 6 } }));

      expect(summary.adherence.rate).toBe(1);
    });

    describe('per-day view', () => {
      const days = [
        { id: 'd1', label: 'دفع', logged: true },
        { id: 'd2', label: 'سحب', logged: true },
        { id: 'd3', label: 'أرجل', logged: false },
        { id: 'd4', label: 'كامل', logged: true },
      ];

      it('passes the training days through in program order', () => {
        const summary = computeWeeklySummary(inputs({ adherenceDays: days }));

        expect(summary.adherence.days.map((day) => day.label)).toEqual([
          'دفع',
          'سحب',
          'أرجل',
          'كامل',
        ]);
      });

      it('lets the caller count sessions rather than exercises', () => {
        const summary = computeWeeklySummary(inputs({ adherenceDays: days }));
        const done = summary.adherence.days.filter((day) => day.logged).length;

        expect(`${done}/${summary.adherence.days.length}`).toBe('3/4');
      });

      it('is empty when the client has no program', () => {
        expect(computeWeeklySummary(inputs()).adherence.days).toEqual([]);
      });
    });
  });

  describe('previous-week comparison', () => {
    it('summarises the prior week alongside the current one', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [day('2026-08-24', { weightKg: 80, caloriesActual: 2000 })],
          adherence: { planned: 10, logged: 8 },
          previous: {
            logs: [
              day('2026-08-17', { weightKg: 82, caloriesActual: 2400 }),
              day('2026-08-18', { weightKg: 81, caloriesActual: 2200 }),
            ],
            adherence: { planned: 10, logged: 5 },
          },
        }),
      );

      expect(summary.averageWeightKg).toBe(80);
      expect(summary.previousWeek.averageWeightKg).toBe(81.5);
      expect(summary.previousWeek.averageCaloriesPerLoggedDay).toBe(2300);
      expect(summary.previousWeek.adherenceRate).toBe(0.5);
    });

    it('reports the previous week average sleep, so the delta can be shown', () => {
      const summary = computeWeeklySummary(
        inputs({
          logs: [day('2026-08-24', { sleepHours: 6.8 })],
          previous: {
            logs: [day('2026-08-17', { sleepHours: 7.0 }), day('2026-08-18', { sleepHours: 7.4 })],
            adherence: { planned: 0, logged: 0 },
          },
        }),
      );

      expect(summary.averageSleepHours).toBe(6.8);
      expect(summary.previousWeek.averageSleepHours).toBe(7.2);
    });

    it('reports null previous sleep when they logged none', () => {
      const summary = computeWeeklySummary(inputs());

      expect(summary.previousWeek.averageSleepHours).toBeNull();
    });
  });

  it('rounds float arithmetic to two decimals', () => {
    const summary = computeWeeklySummary(
      inputs({
        logs: [
          day('2026-08-24', { weightKg: 80.1, waterLActual: 2.7 }),
          day('2026-08-25', { weightKg: 80.2, waterLActual: 1.4 }),
        ],
      }),
    );

    expect(summary.averageWeightKg).toBe(80.15);
    expect(summary.nutrition.waterL.actual).toBe(4.1);
  });
});
