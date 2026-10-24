/**
 * Date helpers for the platform. Everything here works in **UTC** and treats a
 * "day" as a calendar date with no time component, matching the `@db.Date`
 * column used by DailyLog. Using UTC consistently keeps `logDate` stable no
 * matter which timezone the API server or the client browser runs in.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` → a UTC midnight Date. Throws on anything else. */
export function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`Expected a YYYY-MM-DD date, received "${value}"`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`"${value}" is not a valid date`);
  }
  // V8 silently rolls impossible dates over ("2026-02-31" becomes March 3rd),
  // so confirm the parsed date is the one that was asked for.
  if (date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`"${value}" is not a valid calendar date`);
  }
  return date;
}

/** A Date → `YYYY-MM-DD` in UTC. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Strips the time component, in UTC. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export interface IsoWeekRange {
  /** Canonical identifier, e.g. `2026-W35`. */
  week: string;
  /** Monday 00:00:00.000 UTC. */
  start: Date;
  /** Sunday 00:00:00.000 UTC (inclusive — the last day of the week). */
  end: Date;
  /** Monday 00:00:00.000 UTC of the following week (exclusive upper bound). */
  endExclusive: Date;
}

/**
 * Parses an ISO-8601 week identifier (`YYYY-Www`, e.g. `2026-W35`; the `W` is
 * optional so `2026-35` also works) into its Monday–Sunday UTC range.
 *
 * ISO-8601 rule: week 1 is the week containing the year's first Thursday,
 * equivalently the week containing January 4th.
 */
export function parseIsoWeek(value: string): IsoWeekRange {
  const match = /^(\d{4})-W?(\d{1,2})$/i.exec(value.trim());
  if (!match) {
    throw new RangeError(`Expected an ISO week like "2026-W35", received "${value}"`);
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) {
    throw new RangeError(`Week number must be between 1 and 53, received ${week}`);
  }

  const start = startOfIsoWeekByNumber(year, week);

  // Weeks 1–52 always exist; week 53 only exists in long years. If we rolled
  // into the next ISO year, the requested week is not a real week.
  if (getIsoWeekYear(start) !== year) {
    throw new RangeError(`Week ${week} does not exist in ${year}`);
  }

  return {
    week: formatIsoWeek(start),
    start,
    end: addDays(start, 6),
    endExclusive: addDays(start, 7),
  };
}

/** Monday (UTC) of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  // getUTCDay(): 0 = Sunday … 6 = Saturday. ISO weeks start on Monday.
  const offset = (day.getUTCDay() + 6) % 7;
  return addDays(day, -offset);
}

function startOfIsoWeekByNumber(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  return addDays(startOfIsoWeek(jan4), (week - 1) * 7);
}

/** The ISO week-numbering year of `date`, which can differ from its calendar year. */
export function getIsoWeekYear(date: Date): number {
  // The Thursday of an ISO week always falls in that week's numbering year.
  return addDays(startOfIsoWeek(date), 3).getUTCFullYear();
}

/** The ISO week number (1–53) of `date`. */
export function getIsoWeekNumber(date: Date): number {
  const thursday = addDays(startOfIsoWeek(date), 3);
  const firstThursday = addDays(
    startOfIsoWeek(new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))),
    3,
  );
  return Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY)) + 1;
}

/** A Date → its ISO week identifier, e.g. `2026-W35`. */
export function formatIsoWeek(date: Date): string {
  const year = getIsoWeekYear(date);
  const week = getIsoWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** The ISO week range containing `date`. */
export function isoWeekOf(date: Date): IsoWeekRange {
  const start = startOfIsoWeek(date);
  return {
    week: formatIsoWeek(start),
    start,
    end: addDays(start, 6),
    endExclusive: addDays(start, 7),
  };
}

/** The week immediately before `range`. */
export function previousIsoWeek(range: IsoWeekRange): IsoWeekRange {
  const start = addDays(range.start, -7);
  return {
    week: formatIsoWeek(start),
    start,
    end: addDays(start, 6),
    endExclusive: range.start,
  };
}
