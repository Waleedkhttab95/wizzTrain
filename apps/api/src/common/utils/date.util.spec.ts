import {
  formatIsoWeek,
  getIsoWeekNumber,
  getIsoWeekYear,
  isoWeekOf,
  parseIsoDate,
  parseIsoWeek,
  previousIsoWeek,
  toIsoDate,
} from './date.util';

describe('date.util', () => {
  describe('parseIsoDate', () => {
    it('parses a date at UTC midnight', () => {
      expect(parseIsoDate('2026-08-29').toISOString()).toBe('2026-08-29T00:00:00.000Z');
    });

    it.each(['29-08-2026', '2026-8-29', '2026-08-29T10:00:00Z', 'today', ''])(
      'rejects %p',
      (value) => {
        expect(() => parseIsoDate(value)).toThrow(RangeError);
      },
    );

    it('rejects a well-formed but impossible date', () => {
      expect(() => parseIsoDate('2026-02-31')).toThrow(RangeError);
    });
  });

  describe('ISO week numbering', () => {
    // ISO-8601: week 1 is the week containing the first Thursday of the year.
    it.each([
      // [date, expected week-year, expected week number]
      ['2026-01-01', 2026, 1], // Thursday — already week 1 of its own year
      ['2025-12-29', 2026, 1], // Monday of the week containing 2026-01-01
      ['2024-12-30', 2025, 1], // Monday belonging to the next week-year
      ['2021-01-01', 2020, 53], // Friday still inside 2020's 53rd week
      ['2026-08-29', 2026, 35],
    ])('places %s in %i-W%i', (date, year, week) => {
      const parsed = parseIsoDate(date);
      expect(getIsoWeekYear(parsed)).toBe(year);
      expect(getIsoWeekNumber(parsed)).toBe(week);
    });

    it('round-trips a week identifier through parse and format', () => {
      const range = parseIsoWeek('2026-W35');
      expect(formatIsoWeek(range.start)).toBe('2026-W35');
    });
  });

  describe('parseIsoWeek', () => {
    it('returns a Monday-to-Sunday range', () => {
      const range = parseIsoWeek('2026-W35');

      expect(toIsoDate(range.start)).toBe('2026-08-24'); // Monday
      expect(toIsoDate(range.end)).toBe('2026-08-30'); // Sunday
      expect(toIsoDate(range.endExclusive)).toBe('2026-08-31'); // next Monday
      expect(range.start.getUTCDay()).toBe(1);
    });

    it('accepts the identifier without the W separator', () => {
      expect(parseIsoWeek('2026-35').week).toBe('2026-W35');
    });

    // A year has 53 ISO weeks when it starts on a Thursday, or is a leap year
    // starting on a Wednesday. 2020 and 2026 qualify; 2025 does not.
    it.each(['2020-W53', '2026-W53'])('accepts %s — those years have 53 weeks', (week) => {
      expect(parseIsoWeek(week).week).toBe(week);
    });

    it('rejects week 53 in a year that has only 52', () => {
      expect(() => parseIsoWeek('2025-W53')).toThrow(RangeError);
    });

    it.each(['2026-W00', '2026-W54', '26-W35', 'W35', 'not-a-week'])('rejects %p', (value) => {
      expect(() => parseIsoWeek(value)).toThrow(RangeError);
    });
  });

  describe('isoWeekOf / previousIsoWeek', () => {
    it('contains the date it was derived from', () => {
      const range = isoWeekOf(parseIsoDate('2026-08-29'));
      expect(range.week).toBe('2026-W35');
      expect(toIsoDate(range.start)).toBe('2026-08-24');
    });

    it('steps back exactly seven days and abuts the current week', () => {
      const current = parseIsoWeek('2026-W35');
      const previous = previousIsoWeek(current);

      expect(previous.week).toBe('2026-W34');
      expect(toIsoDate(previous.start)).toBe('2026-08-17');
      expect(previous.endExclusive.getTime()).toBe(current.start.getTime());
    });

    it('crosses a year boundary correctly', () => {
      expect(previousIsoWeek(parseIsoWeek('2026-W01')).week).toBe('2025-W52');
    });
  });
});
