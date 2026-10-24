import type { DailyLogView, NutritionPlanView } from '@wizzapp/shared';
import { describe, expect, it } from 'vitest';
import {
  FIELDS,
  adjust,
  buildPayload,
  clampTo,
  compareLine,
  formatValue,
  hintFor,
  seedValues,
  type FieldKey,
} from './logWizard';

const spec = (key: FieldKey) => FIELDS.find((f) => f.key === key)!;

function log(over: Partial<DailyLogView> = {}): DailyLogView {
  return {
    id: 'l1',
    logDate: '2026-09-10',
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
    ...over,
  };
}

const plan: NutritionPlanView = {
  id: 'n1',
  dailyCalories: 2200,
  proteinG: 170,
  carbsG: 210,
  fatG: 65,
  fiberMinG: 30,
  waterMinL: 3,
  stepsMin: 8000,
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  meals: [],
};

describe('FIELDS', () => {
  it('has the ten steps the handoff specifies, ending with the note', () => {
    expect(FIELDS).toHaveLength(10);
    expect(FIELDS[9].key).toBe('note');
  });

  it('maps every numeric step onto a real DailyLog field', () => {
    for (const field of FIELDS.slice(0, 9)) {
      expect(field.field).not.toBeNull();
    }
  });

  it.each([
    ['weight', 0.1, 1],
    ['kcal', 50, 0],
    ['protein', 5, 0],
    ['fiber', 2, 0],
    ['water', 0.25, 2],
    ['sleep', 0.5, 1],
    ['steps', 500, 0],
  ] as [FieldKey, number, number][])('%s steps by %p with %i decimals', (key, step, decimals) => {
    expect(spec(key).step).toBe(step);
    expect(spec(key).decimals).toBe(decimals);
  });

  it('gives every numeric field four quick chips', () => {
    for (const field of FIELDS.slice(0, 9)) {
      expect(field.quick).toHaveLength(4);
    }
  });
});

describe('clampTo / adjust', () => {
  it('steps a decimal field without float drift', () => {
    let water = 2.5;
    for (let i = 0; i < 4; i += 1) water = adjust(spec('water'), water, 0.25);
    expect(water).toBe(3.5);
  });

  it('keeps whole fields whole', () => {
    expect(Number.isInteger(adjust(spec('steps'), 8000, 500))).toBe(true);
  });

  it('clamps to the field minimum', () => {
    expect(adjust(spec('weight'), 30, -5)).toBe(30);
    expect(adjust(spec('steps'), 0, -500)).toBe(0);
  });

  it('clamps to the field maximum', () => {
    expect(adjust(spec('sleep'), 24, 1)).toBe(24);
  });

  it('rounds a stray value onto the field precision', () => {
    expect(clampTo(spec('weight'), 80.46)).toBe(80.5);
    expect(clampTo(spec('kcal'), 2000.7)).toBe(2001);
  });
});

describe('formatValue', () => {
  it('shows two decimals for water so 3 reads as 3.00', () => {
    expect(formatValue(spec('water'), 3)).toBe('3.00');
  });

  it('shows one decimal for weight', () => {
    expect(formatValue(spec('weight'), 80)).toBe('80');
    expect(formatValue(spec('weight'), 80.4)).toBe('80.4');
  });

  it('groups thousands in Western numerals', () => {
    expect(formatValue(spec('steps'), 11500)).toBe('11,500');
  });
});

describe('seedValues', () => {
  it("carries over the client's previous entry", () => {
    const values = seedValues(null, log({ weightKg: 95.4, caloriesActual: 2240 }));

    expect(values.weight).toBe(95.4);
    expect(values.kcal).toBe(2240);
  });

  it('prefers what is already stored for the day being edited', () => {
    const values = seedValues(log({ weightKg: 94 }), log({ weightKg: 95.4 }));

    expect(values.weight).toBe(94);
  });

  it('falls back to a sane default when there is no history at all', () => {
    const values = seedValues(null, null);

    expect(values.weight).toBe(80);
    expect(values.steps).toBe(8000);
  });

  it('falls back per field, not all-or-nothing', () => {
    // Previous day recorded weight but never touched steps.
    const values = seedValues(null, log({ weightKg: 95.4 }));

    expect(values.weight).toBe(95.4);
    expect(values.steps).toBe(8000);
  });

  it('does not seed the note step', () => {
    expect(seedValues(null, null)).not.toHaveProperty('note');
  });
});

describe('hintFor', () => {
  it('fills the target from the plan', () => {
    expect(hintFor(spec('kcal'), plan)).toBe('الهدف 2,200');
    expect(hintFor(spec('protein'), plan)).toBe('الهدف 170 g');
  });

  it('keeps a fixed hint that does not depend on the plan', () => {
    expect(hintFor(spec('weight'), plan)).toBe('الصبح على الفاضي أفضل قياس');
  });

  it('is empty when the client has no plan', () => {
    expect(hintFor(spec('kcal'), null)).toBe('');
  });

  it('is empty for an optional target the trainer never set', () => {
    expect(hintFor(spec('fiber'), { ...plan, fiberMinG: null })).toBe('');
  });
});

describe('compareLine', () => {
  it('shows the previous value for that field', () => {
    expect(compareLine(spec('weight'), log({ weightKg: 95.4 }))).toBe('آخر تسجيل: 95.4');
  });

  it('is empty when the previous day left the field blank', () => {
    expect(compareLine(spec('weight'), log())).toBe('');
  });

  it('is empty when there is no previous log', () => {
    expect(compareLine(spec('weight'), null)).toBe('');
  });
});

describe('buildPayload', () => {
  const values = { weight: 94.8, kcal: 2100, protein: 160, sleep: 7.5 };

  it('sends the date and the values the client entered', () => {
    const body = buildPayload('2026-09-11', values, '', new Set(), null);

    expect(body).toMatchObject({
      logDate: '2026-09-11',
      weightKg: 94.8,
      caloriesActual: 2100,
      proteinGActual: 160,
      sleepHours: 7.5,
    });
  });

  it('includes the note only when one was written', () => {
    expect(buildPayload('2026-09-11', values, '  ', new Set(), null)).not.toHaveProperty('notes');
    expect(buildPayload('2026-09-11', values, ' نمت متأخر ', new Set(), null).notes).toBe(
      'نمت متأخر',
    );
  });

  it('omits a skipped field that was never stored', () => {
    const body = buildPayload('2026-09-11', values, '', new Set<FieldKey>(['weight']), null);

    expect(body).not.toHaveProperty('weightKg');
  });

  it('preserves a stored value when the client skips that field', () => {
    // The API replaces the whole day, so skipping must not wipe what is there.
    const stored = log({ logDate: '2026-09-11', weightKg: 95.1, stepsActual: 9000 });
    const body = buildPayload('2026-09-11', values, '', new Set<FieldKey>(['weight']), stored);

    expect(body.weightKg).toBe(95.1);
  });

  it('preserves a stored note when the note step is skipped', () => {
    const stored = log({ logDate: '2026-09-11', notes: 'ملاحظة قديمة' });
    const body = buildPayload('2026-09-11', values, '', new Set<FieldKey>(['note']), stored);

    expect(body.notes).toBe('ملاحظة قديمة');
  });

  it('lets a newly written note replace the stored one', () => {
    const stored = log({ logDate: '2026-09-11', notes: 'ملاحظة قديمة' });
    const body = buildPayload('2026-09-11', values, 'ملاحظة جديدة', new Set(), stored);

    expect(body.notes).toBe('ملاحظة جديدة');
  });

  it('never sends a value for a field with no entry', () => {
    const body = buildPayload('2026-09-11', {}, '', new Set(), null);

    expect(Object.keys(body)).toEqual(['logDate']);
  });
});
