import type { WorkoutProgramView } from '@wizzapp/shared';

/**
 * Which training day to show "today".
 *
 * The backend deliberately gives a WorkoutDay no date — just a label and an
 * order — so this is the app's decision, not a lookup. We remember the day the
 * client last logged against and suggest the next one in the cycle; they can
 * always pick a different one.
 */
const KEY = 'wizzapp.lastDay';

export function readLastDay(programId: string): string | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? ((JSON.parse(raw) as Record<string, string>)[programId] ?? null) : null;
  } catch {
    return null;
  }
}

export function writeLastDay(programId: string, dayId: string): void {
  try {
    const raw = window.localStorage.getItem(KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[programId] = dayId;
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* the suggestion is a convenience — losing it costs nothing */
  }
}

/** The day after the one last completed, or the first day for a fresh start. */
export function suggestedDay(program: WorkoutProgramView): WorkoutProgramView['days'][number] | null {
  const days = program.days;
  if (days.length === 0) return null;

  const last = readLastDay(program.id);
  const index = days.findIndex((day) => day.id === last);
  return index >= 0 ? days[(index + 1) % days.length] : days[0];
}

/** Local calendar date of a log timestamp, for "did this happen today?". */
export function localDateOf(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
