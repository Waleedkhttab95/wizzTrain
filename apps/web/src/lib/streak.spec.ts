import type { DailyLogView } from '@wizzapp/shared';
import { describe, expect, it } from 'vitest';
import { computeStreak, logFor, previousLog, streakDots } from './streak';

const TODAY = '2026-09-11';

function logs(...dates: string[]): DailyLogView[] {
  return dates.map((logDate) => ({
    id: logDate,
    logDate,
    weightKg: null,
    caloriesActual: null,
    carbsGActual: null,
    proteinGActual: null,
    fatGActual: null,
    fiberGActual: null,
    waterLActual: null,
    sleepHours: null,
    stepsActual: null,
    notes: null,
  }));
}

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    const streak = computeStreak(logs('2026-09-11', '2026-09-10', '2026-09-09'), TODAY);

    expect(streak).toEqual({ length: 3, loggedToday: true });
  });

  it('keeps the streak alive when today is still unlogged', () => {
    // The day is not over — breaking the streak at midnight would be wrong.
    const streak = computeStreak(logs('2026-09-10', '2026-09-09'), TODAY);

    expect(streak).toEqual({ length: 2, loggedToday: false });
  });

  it('breaks once a whole day has been missed', () => {
    const streak = computeStreak(logs('2026-09-09', '2026-09-08'), TODAY);

    expect(streak.length).toBe(0);
    expect(streak.loggedToday).toBe(false);
  });

  it('stops at the first gap rather than counting every log', () => {
    const streak = computeStreak(
      logs('2026-09-11', '2026-09-10', '2026-09-08', '2026-09-07'),
      TODAY,
    );

    expect(streak.length).toBe(2);
  });

  it('is zero for a client who has never logged', () => {
    expect(computeStreak([], TODAY)).toEqual({ length: 0, loggedToday: false });
  });

  it('counts a single day logged today', () => {
    expect(computeStreak(logs('2026-09-11'), TODAY)).toEqual({ length: 1, loggedToday: true });
  });

  it('ignores future-dated rows', () => {
    const streak = computeStreak(logs('2026-09-12', '2026-09-11'), TODAY);

    expect(streak.length).toBe(1);
  });

  it('crosses a month boundary', () => {
    const streak = computeStreak(logs('2026-09-01', '2026-08-31', '2026-08-30'), '2026-09-01');

    expect(streak.length).toBe(3);
  });
});

describe('streakDots', () => {
  it('returns seven days, oldest first, ending today', () => {
    const dots = streakDots(logs('2026-09-11', '2026-09-09'), TODAY);

    expect(dots).toHaveLength(7);
    expect(dots[6]).toBe(true); // today
    expect(dots[5]).toBe(false); // yesterday
    expect(dots[4]).toBe(true); // two days ago
  });

  it('is all false when nothing was logged', () => {
    expect(streakDots([], TODAY)).toEqual([false, false, false, false, false, false, false]);
  });
});

describe('previousLog', () => {
  it('finds the most recent log before the given date', () => {
    const found = previousLog(logs('2026-09-11', '2026-09-08', '2026-09-10'), '2026-09-11');

    expect(found?.logDate).toBe('2026-09-10');
  });

  it('ignores the date itself', () => {
    expect(previousLog(logs('2026-09-11'), '2026-09-11')).toBeNull();
  });

  it('returns null when there is nothing earlier', () => {
    expect(previousLog([], '2026-09-11')).toBeNull();
  });
});

describe('logFor', () => {
  it('returns the log on that date', () => {
    expect(logFor(logs('2026-09-10', '2026-09-11'), '2026-09-10')?.logDate).toBe('2026-09-10');
  });

  it('returns null when the day is unlogged', () => {
    expect(logFor(logs('2026-09-10'), '2026-09-11')).toBeNull();
  });
});
