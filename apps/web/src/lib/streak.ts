import type { DailyLogView } from '@wizzapp/shared';
import { addDaysIso, todayIso } from './format';

/**
 * How many days in a row the client has logged, and whether today is one of
 * them. The handoff shows this on the home card and the wizard's done screen.
 *
 * A streak that ends yesterday still counts — the day is not over yet, so
 * breaking it the moment the clock rolls past midnight would be punishing and
 * wrong. It only breaks once a full day has been missed.
 */
export interface Streak {
  /** Consecutive logged days, counting back from today or yesterday. */
  length: number;
  loggedToday: boolean;
}

export function computeStreak(logs: DailyLogView[], today = todayIso()): Streak {
  const dates = new Set(logs.map((log) => log.logDate));
  const loggedToday = dates.has(today);

  // Anchor on today when it's logged, otherwise on yesterday.
  let cursor = loggedToday ? today : addDaysIso(today, -1);
  if (!dates.has(cursor)) {
    return { length: 0, loggedToday };
  }

  let length = 0;
  while (dates.has(cursor)) {
    length += 1;
    cursor = addDaysIso(cursor, -1);
  }

  return { length, loggedToday };
}

/**
 * The last seven days as booleans, oldest first — the dots on the done screen.
 */
export function streakDots(logs: DailyLogView[], today = todayIso()): boolean[] {
  const dates = new Set(logs.map((log) => log.logDate));
  const dots: boolean[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    dots.push(dates.has(addDaysIso(today, -offset)));
  }
  return dots;
}

/** The most recent log strictly before `date`, for the wizard's comparison line. */
export function previousLog(logs: DailyLogView[], date: string): DailyLogView | null {
  const earlier = logs
    .filter((log) => log.logDate < date)
    .sort((a, b) => b.logDate.localeCompare(a.logDate));
  return earlier[0] ?? null;
}

/** The log for a given date, if the client already filled it in. */
export function logFor(logs: DailyLogView[], date: string): DailyLogView | null {
  return logs.find((log) => log.logDate === date) ?? null;
}
