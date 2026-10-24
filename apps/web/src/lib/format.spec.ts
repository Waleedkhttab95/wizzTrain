import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  decimal,
  initials,
  isoWeekOf,
  num,
  percent,
  shiftIsoWeek,
  signed,
  weekLabel,
} from './format';

describe('num / decimal — null means "no data", never zero', () => {
  it.each([null, undefined, NaN, Infinity])('renders %p as an em dash', (value) => {
    expect(num(value as number | null)).toBe('—');
    expect(decimal(value as number | null)).toBe('—');
  });

  it('renders zero as zero, which is a real value', () => {
    expect(num(0)).toBe('0');
    expect(decimal(0)).toBe('0');
  });

  it('uses Western numerals with thousands separators', () => {
    expect(num(12345)).toBe('12,345');
  });

  it('drops a trailing .0 so 68.0 reads as 68', () => {
    expect(decimal(68)).toBe('68');
    expect(decimal(68.4)).toBe('68.4');
  });

  it('rounds to the requested precision', () => {
    expect(decimal(68.46, 1)).toBe('68.5');
  });
});

describe('percent', () => {
  it('renders a 0-1 rate as a whole percentage', () => {
    expect(percent(0.75)).toBe('75%');
    expect(percent(0)).toBe('0%');
    expect(percent(1)).toBe('100%');
  });

  it('distinguishes "no data" from zero', () => {
    expect(percent(null)).toBe('—');
  });
});

describe('signed', () => {
  it('keeps the plus sign on a gain', () => {
    expect(signed(0.4)).toBe('+0.4');
  });

  it('keeps the minus on a loss', () => {
    expect(signed(-1.2)).toBe('-1.2');
  });

  it('appends a unit when given one', () => {
    expect(signed(-1.2, 'كجم')).toContain('كجم');
  });

  it('returns an em dash for no data', () => {
    expect(signed(null)).toBe('—');
  });
});

describe('addDaysIso', () => {
  it('moves forward and back across a month boundary', () => {
    expect(addDaysIso('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDaysIso('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('crosses a leap day correctly', () => {
    expect(addDaysIso('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('isoWeekOf — must agree with the API, which drives the summary', () => {
  it.each([
    ['2026-08-24', '2026-W35'], // Monday
    ['2026-08-30', '2026-W35'], // Sunday of the same week
    ['2026-08-31', '2026-W36'], // next Monday
    ['2026-01-01', '2026-W01'], // Thursday, already week 1
    ['2025-12-29', '2026-W01'], // Monday belonging to next year's week 1
    ['2021-01-01', '2020-W53'], // Friday still inside 2020's 53rd week
  ])('places %s in %s', (date, week) => {
    expect(isoWeekOf(date)).toBe(week);
  });
});

describe('shiftIsoWeek', () => {
  it('steps within a year', () => {
    expect(shiftIsoWeek('2026-W35', -1)).toBe('2026-W34');
    expect(shiftIsoWeek('2026-W35', 1)).toBe('2026-W36');
  });

  it('crosses a year boundary in both directions', () => {
    expect(shiftIsoWeek('2026-W01', -1)).toBe('2025-W52');
    expect(shiftIsoWeek('2020-W53', 1)).toBe('2021-W01');
  });

  it('is its own inverse', () => {
    expect(shiftIsoWeek(shiftIsoWeek('2026-W10', 5), -5)).toBe('2026-W10');
  });
});

describe('weekLabel', () => {
  it('reads the week number without a leading zero', () => {
    expect(weekLabel('2026-W05')).toBe('الأسبوع 5 · 2026');
  });

  it('passes an unrecognised value straight through', () => {
    expect(weekLabel('nonsense')).toBe('nonsense');
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('فهد الحربي')).toBe('فا');
  });

  it('handles a single name', () => {
    expect(initials('فهد')).toBe('ف');
  });

  it('ignores extra whitespace', () => {
    expect(initials('  ريم   القحطاني  ')).toBe('را');
  });

  it('returns nothing for an empty name rather than throwing', () => {
    expect(initials('')).toBe('');
  });
});
