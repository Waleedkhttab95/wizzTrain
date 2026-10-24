import type {
  NutrientTotals,
  WeeklyAdherence,
  WeeklySummaryView,
  WeightTrendPoint,
} from '@wizzapp/shared';
import { toIsoDate, type IsoWeekRange } from '../common/utils/date.util';

/** Days in a week — the multiplier that turns a daily target into a weekly one. */
export const DAYS_PER_WEEK = 7;

/** One day of measurements, as read from DailyLog. */
export interface DailyMetrics {
  logDate: Date;
  weightKg: number | null;
  caloriesActual: number | null;
  carbsGActual: number | null;
  proteinGActual: number | null;
  fatGActual: number | null;
  fiberGActual: number | null;
  waterLActual: number | null;
  sleepHours: number | null;
  stepsActual: number | null;
}

/** Daily targets from the client's active NutritionPlan, if they have one. */
export interface WeeklyTargets {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberMinG: number | null;
  waterMinL: number | null;
  stepsMin: number | null;
}

export interface AdherenceCounts {
  planned: number;
  logged: number;
}

/** One training day and whether it saw any activity in the window. */
export interface DayActivity {
  id: string;
  label: string;
  logged: boolean;
}

export interface WeeklyInputs {
  range: IsoWeekRange;
  logs: DailyMetrics[];
  targets: WeeklyTargets | null;
  adherence: AdherenceCounts;
  /** Program days, in order, flagged for this week. Empty when no program. */
  adherenceDays: DayActivity[];
  previous: {
    logs: DailyMetrics[];
    adherence: AdherenceCounts;
  };
}

/**
 * Computes the whole weekly summary from raw rows — no database access, so the
 * arithmetic (spec §F8) can be tested directly.
 *
 * Two averaging conventions are used deliberately:
 *  - **Totals** are sums over whatever the client actually logged.
 *  - **Averages** divide by the number of days that carry a value for *that*
 *    metric, not by 7. A client who logs weight on 3 days gets the average of
 *    those 3 days, rather than an average diluted by 4 blank days.
 */
export function computeWeeklySummary(input: WeeklyInputs): WeeklySummaryView {
  const { range, logs, targets, adherence, adherenceDays, previous } = input;

  const weightTrend = buildWeightTrend(logs);
  const daysLogged = logs.length;

  return {
    week: range.week,
    weekStart: toIsoDate(range.start),
    weekEnd: toIsoDate(range.end),
    daysLogged,
    averageWeightKg: average(values(logs, (log) => log.weightKg)),
    weightChangeKg: weightChange(weightTrend),
    weightTrend,
    nutrition: {
      calories: nutrient(logs, (log) => log.caloriesActual, targets?.dailyCalories ?? null),
      protein: nutrient(logs, (log) => log.proteinGActual, targets?.proteinG ?? null),
      carbs: nutrient(logs, (log) => log.carbsGActual, targets?.carbsG ?? null),
      fat: nutrient(logs, (log) => log.fatGActual, targets?.fatG ?? null),
      fiber: nutrient(logs, (log) => log.fiberGActual, targets?.fiberMinG ?? null),
      waterL: nutrient(logs, (log) => log.waterLActual, targets?.waterMinL ?? null),
      steps: nutrient(logs, (log) => log.stepsActual, targets?.stepsMin ?? null),
    },
    averageSleepHours: average(values(logs, (log) => log.sleepHours)),
    adherence: toAdherence(adherence, adherenceDays),
    previousWeek: {
      averageWeightKg: average(values(previous.logs, (log) => log.weightKg)),
      averageCaloriesPerLoggedDay: average(values(previous.logs, (log) => log.caloriesActual)),
      averageSleepHours: average(values(previous.logs, (log) => log.sleepHours)),
      adherenceRate: toAdherence(previous.adherence, []).rate,
    },
  };
}

/** Sum, weekly target, remaining and per-logged-day average for one nutrient. */
function nutrient(
  logs: DailyMetrics[],
  pick: (log: DailyMetrics) => number | null,
  dailyTarget: number | null,
): NutrientTotals {
  const logged = values(logs, pick);
  const actual = round(logged.reduce((sum, value) => sum + value, 0));
  const target = dailyTarget === null ? null : round(dailyTarget * DAYS_PER_WEEK);

  return {
    actual,
    target,
    // Floored at 0: once the client is over target, "remaining" is simply none
    // left, and a negative number here would read as a deficit in the UI.
    remaining: target === null ? null : round(Math.max(0, target - actual)),
    dailyAverage: average(logged),
  };
}

function toAdherence(counts: AdherenceCounts, days: DayActivity[]): WeeklyAdherence {
  const { planned, logged } = counts;
  return {
    planned,
    logged,
    // Capped at 1: logging an extra session is adherence of 100%, not 130%.
    rate: planned === 0 ? null : round(Math.min(logged / planned, 1), 4),
    days,
  };
}

function buildWeightTrend(logs: DailyMetrics[]): WeightTrendPoint[] {
  return logs
    .filter((log): log is DailyMetrics & { weightKg: number } => log.weightKg !== null)
    .map((log) => ({ date: toIsoDate(log.logDate), weightKg: log.weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Net change across the week: last recorded weight minus the first. */
function weightChange(trend: WeightTrendPoint[]): number | null {
  if (trend.length < 2) return null;
  return round(trend[trend.length - 1].weightKg - trend[0].weightKg);
}

function values(logs: DailyMetrics[], pick: (log: DailyMetrics) => number | null): number[] {
  const result: number[] = [];
  for (const log of logs) {
    const value = pick(log);
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      result.push(value);
    }
  }
  return result;
}

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

/** Keeps float arithmetic from surfacing as 71.30000000000001 in the UI. */
function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
