import type { ClientSummary } from '@wizzapp/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATUS, avatarColor, goalLine, lastLogLabel } from './clientStatus';

const NOW = new Date('2026-09-09T12:00:00Z');

function client(over: Partial<ClientSummary> = {}): ClientSummary {
  return {
    id: 'c1',
    name: 'فهد الحربي',
    email: 'fahad@example.com',
    phone: null,
    goalWeightKg: null,
    startWeightKg: null,
    startDate: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    lastLogDate: null,
    latestWeightKg: null,
    weekStrip: [false, false, false, false, false, false, false],
    daysLoggedThisWeek: 0,
    archivedAt: null,
    status: 'behind',
    ...over,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('goalLine', () => {
  it('measures the gap from the latest logged weight', () => {
    expect(goalLine(client({ latestWeightKg: 88, goalWeightKg: 82 })).delta).toBe('-6');
  });

  it('keeps an explicit plus for a client who needs to gain', () => {
    expect(goalLine(client({ latestWeightKg: 70, goalWeightKg: 78 })).delta).toBe('+8');
  });

  it('falls back to the sign-up weight before the first daily log', () => {
    const line = goalLine(client({ startWeightKg: 92, goalWeightKg: 82, latestWeightKg: null }));

    expect(line.delta).toBe('-10');
  });

  it('prefers the logged weight over the sign-up weight once logging starts', () => {
    const line = goalLine(client({ startWeightKg: 92, latestWeightKg: 86, goalWeightKg: 82 }));

    expect(line.delta).toBe('-4');
  });

  it('rounds to one decimal rather than leaking float noise', () => {
    expect(goalLine(client({ latestWeightKg: 88.42, goalWeightKg: 82 })).delta).toBe('-6.4');
    expect(goalLine(client({ latestWeightKg: 82.17, goalWeightKg: 78.9 })).delta).toBe('-3.3');
  });

  it('rounds a half toward positive infinity, matching the API summary', () => {
    // Math.round(-63.5) is -63, so -6.35 lands on -6.3 rather than -6.4. The
    // asymmetry is cosmetic on a display figure, and staying consistent with
    // the server's own rounding matters more than symmetry here.
    expect(goalLine(client({ latestWeightKg: 88.35, goalWeightKg: 82 })).delta).toBe('-6.3');
  });

  it('shows the bare target when there is no current weight to compare', () => {
    const line = goalLine(client({ goalWeightKg: 82 }));

    expect(line.delta).toBeNull();
    expect(line.target).toBe('82');
  });

  it('reports neither when no goal is set', () => {
    const line = goalLine(client({ latestWeightKg: 88 }));

    expect(line.delta).toBeNull();
    expect(line.target).toBeNull();
  });

  describe('programme week', () => {
    it('counts the first seven days as week 1', () => {
      expect(goalLine(client({ startDate: '2026-09-09' })).week).toBe(1);
      expect(goalLine(client({ startDate: '2026-09-03' })).week).toBe(1);
    });

    it('rolls over on the eighth day', () => {
      expect(goalLine(client({ startDate: '2026-09-02' })).week).toBe(2);
    });

    it('has no week before the start date', () => {
      expect(goalLine(client({ startDate: '2026-10-01' })).week).toBeNull();
    });

    it('has no week when no start date is set', () => {
      expect(goalLine(client()).week).toBeNull();
    });
  });
});

describe('lastLogLabel', () => {
  it.each([
    ['2026-09-09', 'اليوم'],
    ['2026-09-08', 'أمس'],
    ['2026-09-07', 'قبل يومين'],
    ['2026-09-05', 'قبل 4 أيام'],
  ])('renders %s as %s', (date, expected) => {
    expect(lastLogLabel(date)).toBe(expected);
  });

  it('switches to weeks once the gap grows past ten days', () => {
    expect(lastLogLabel('2026-08-25')).toBe('قبل 2 أسابيع');
  });

  it('says so plainly when they have never logged', () => {
    expect(lastLogLabel(null)).toBe('لم يسجّل بعد');
  });

  it('does not report a future date as days ago', () => {
    expect(lastLogLabel('2026-09-10')).toBe('اليوم');
  });
});

describe('avatarColor', () => {
  it('is stable for a given id', () => {
    expect(avatarColor('client-1')).toBe(avatarColor('client-1'));
  });

  it('spreads different ids across the palette', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `client-${i}`);
    const used = new Set(ids.map(avatarColor));

    expect(used.size).toBeGreaterThan(1);
  });

  it('always returns a colour from the palette', () => {
    expect(avatarColor('anything')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('STATUS vocabulary', () => {
  it('pairs every status with a label, so colour is never the only signal', () => {
    for (const key of ['committed', 'partial', 'behind'] as const) {
      expect(STATUS[key].label).toBeTruthy();
      expect(STATUS[key].dot).toMatch(/^#/);
    }
  });
});
