import { parseIsoDate } from '../common/utils/date.util';
import { summariseAdherence, type RecentLog } from './adherence';

const TODAY = parseIsoDate('2026-09-09');

/** Logs on the given ISO dates, newest first, as the repository returns them. */
function logs(...entries: (string | [string, number])[]): RecentLog[] {
  return entries
    .map((entry) => (typeof entry === 'string' ? [entry, null] : entry) as [string, number | null])
    .map(([date, weightKg]) => ({ logDate: parseIsoDate(date), weightKg }))
    .sort((a, b) => b.logDate.getTime() - a.logDate.getTime());
}

describe('summariseAdherence', () => {
  it('returns an empty week for a client who has never logged', () => {
    const result = summariseAdherence([], TODAY);

    expect(result.lastLogDate).toBeNull();
    expect(result.latestWeightKg).toBeNull();
    expect(result.weekStrip).toEqual([false, false, false, false, false, false, false]);
    expect(result.daysLoggedThisWeek).toBe(0);
    expect(result.status).toBe('behind');
  });

  it('places today at the end of the strip, oldest first', () => {
    const result = summariseAdherence(logs('2026-09-09', '2026-09-03'), TODAY);

    // Window is 2026-09-03 … 2026-09-09, so both fall at the two ends.
    expect(result.weekStrip).toEqual([true, false, false, false, false, false, true]);
  });

  it('takes the weight from the most recent log, not the newest weight', () => {
    const result = summariseAdherence(logs(['2026-09-09', 81.2], ['2026-09-08', 99]), TODAY);

    expect(result.lastLogDate).toBe('2026-09-09');
    expect(result.latestWeightKg).toBe(81.2);
  });

  it('reports a null weight when the latest log recorded none', () => {
    const result = summariseAdherence(logs('2026-09-09', ['2026-09-08', 80]), TODAY);

    expect(result.latestWeightKg).toBeNull();
  });

  it('ignores logs older than the window when building the strip', () => {
    const result = summariseAdherence(logs('2026-08-01', '2026-09-09'), TODAY);

    expect(result.daysLoggedThisWeek).toBe(1);
    // …but they still count as the last time this client logged.
    expect(result.lastLogDate).toBe('2026-09-09');
  });

  it('still reports the last log date when it is outside the window', () => {
    const result = summariseAdherence(logs('2026-08-20'), TODAY);

    expect(result.lastLogDate).toBe('2026-08-20');
    expect(result.daysLoggedThisWeek).toBe(0);
    expect(result.status).toBe('behind');
  });

  describe('status thresholds', () => {
    const window = [
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
    ];

    it.each([
      [7, 'committed'],
      [5, 'committed'],
      [4, 'partial'],
      [3, 'partial'],
      [2, 'behind'],
      [0, 'behind'],
    ])('%i logged days → %s', (count, expected) => {
      const result = summariseAdherence(logs(...window.slice(0, count)), TODAY);

      expect(result.daysLoggedThisWeek).toBe(count);
      expect(result.status).toBe(expected);
    });
  });
});
