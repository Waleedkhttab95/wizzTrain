import type { AdherenceStatus } from '@wizzapp/shared';
import { addDays, startOfUtcDay, toIsoDate } from '../common/utils/date.util';

/** Days in the rolling window the roster summarises. */
export const WEEK_WINDOW = 7;

/** Logged on at least this many of the last 7 days → committed. */
const COMMITTED_MIN = 5;
/** At least this many → partial. Below it → behind. */
const PARTIAL_MIN = 3;

export interface RecentLog {
  logDate: Date;
  weightKg: number | null;
}

export interface AdherenceSummary {
  lastLogDate: string | null;
  latestWeightKg: number | null;
  /** Oldest first, ending today. */
  weekStrip: boolean[];
  daysLoggedThisWeek: number;
  status: AdherenceStatus;
}

/**
 * Turns a client's recent daily logs into the figures the roster card shows.
 *
 * The window is the last seven calendar days **ending today**, not the ISO
 * week — a trainer scanning the roster wants "have they logged lately", which
 * a Monday-start week answers badly on a Monday morning.
 *
 * `logs` must be newest-first; only the most recent is used for the weight.
 */
export function summariseAdherence(logs: RecentLog[], today = new Date()): AdherenceSummary {
  const end = startOfUtcDay(today);

  // The seven dates in the window, oldest first.
  const window: string[] = [];
  for (let offset = WEEK_WINDOW - 1; offset >= 0; offset -= 1) {
    window.push(toIsoDate(addDays(end, -offset)));
  }

  const loggedDates = new Set(logs.map((log) => toIsoDate(log.logDate)));
  const weekStrip = window.map((date) => loggedDates.has(date));
  const daysLoggedThisWeek = weekStrip.filter(Boolean).length;

  const [latest] = logs;

  return {
    lastLogDate: latest ? toIsoDate(latest.logDate) : null,
    latestWeightKg: latest?.weightKg ?? null,
    weekStrip,
    daysLoggedThisWeek,
    status: statusFor(daysLoggedThisWeek),
  };
}

function statusFor(daysLogged: number): AdherenceStatus {
  if (daysLogged >= COMMITTED_MIN) return 'committed';
  if (daysLogged >= PARTIAL_MIN) return 'partial';
  return 'behind';
}
