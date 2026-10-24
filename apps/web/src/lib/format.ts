/**
 * Display helpers.
 *
 * The handoff is explicit: numerals are Western (0-9) everywhere, never
 * Eastern-Arabic. `ar-EG` alone yields ٣ سبتمبر, so every formatter pins the
 * Latin numbering system with the `-u-nu-latn` extension.
 */
const AR_LATN = 'ar-EG-u-nu-latn';

const NBSP = ' ';

/** `null` from the API means "no data" and must never render as 0 (spec §F8). */
export function num(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function decimal(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  // Drop a trailing .0 so 68.0 reads as 68.
  const fixed = Number(value.toFixed(digits));
  return fixed.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function percent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return '—';
  return `${Math.round(rate * 100)}%`;
}

export function signed(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${decimal(value, 1)}${unit ? NBSP + unit : ''}`;
}

/** Today as `YYYY-MM-DD` in the *viewer's* local calendar, which is what they mean by "today". */
export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const AR_DATE = new Intl.DateTimeFormat(AR_LATN, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const AR_DAY_MONTH = new Intl.DateTimeFormat(AR_LATN, {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const AR_WEEKDAY = new Intl.DateTimeFormat(AR_LATN, { weekday: 'long', timeZone: 'UTC' });

export function longDate(iso: string): string {
  return AR_DATE.format(new Date(`${iso}T00:00:00Z`));
}

export function shortDate(iso: string): string {
  return AR_DAY_MONTH.format(new Date(`${iso}T00:00:00Z`));
}

export function weekday(iso: string): string {
  return AR_WEEKDAY.format(new Date(`${iso}T00:00:00Z`));
}

export function relativeDay(iso: string): string {
  const today = todayIso();
  if (iso === today) return 'اليوم';
  if (iso === addDaysIso(today, -1)) return 'أمس';
  return `${weekday(iso)} ${shortDate(iso)}`;
}

/** The ISO week (`2026-W35`) containing a local date — matches the API's convention. */
export function isoWeekOf(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day + 3); // the Thursday of this week
  const year = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000)) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function shiftIsoWeek(week: string, delta: number): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) return week;
  const [, year, num] = match;
  // Step through a real date so year boundaries and 53-week years behave.
  const jan4 = new Date(Date.UTC(Number(year), 0, 4));
  const offset = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(jan4.getTime() - offset * 86_400_000);
  monday.setUTCDate(monday.getUTCDate() + (Number(num) - 1 + delta) * 7);
  return isoWeekOf(monday.toISOString().slice(0, 10));
}

export function weekLabel(week: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  return match ? `الأسبوع ${Number(match[2])} · ${match[1]}` : week;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}
