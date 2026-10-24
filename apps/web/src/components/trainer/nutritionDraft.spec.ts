import type { NutritionPlanView } from '@wizzapp/shared';
import { describe, expect, it } from 'vitest';
import {
  FIELDS,
  KCAL_CEILING,
  KCAL_FLOOR,
  bump,
  bumpKcal,
  hasChanges,
  macroPercent,
  toDraft,
  toPayload,
  type FieldKey,
} from './nutritionDraft';

const field = (key: FieldKey) => FIELDS.find((f) => f.key === key)!;

function plan(over: Partial<NutritionPlanView> = {}): NutritionPlanView {
  return {
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
    meals: [{ id: 'm1', name: 'فطور', description: 'شوفان وبيض' }],
    ...over,
  };
}

describe('bumpKcal', () => {
  it('steps by 50', () => {
    expect(bumpKcal(2200, 1)).toBe(2250);
    expect(bumpKcal(2200, -1)).toBe(2150);
  });

  it('will not go below the safe floor', () => {
    expect(bumpKcal(KCAL_FLOOR, -1)).toBe(KCAL_FLOOR);
    expect(bumpKcal(KCAL_FLOOR + 20, -1)).toBe(KCAL_FLOOR);
  });

  it('will not exceed what the API accepts', () => {
    expect(bumpKcal(KCAL_CEILING, 1)).toBe(KCAL_CEILING);
  });
});

describe('bump — per-field steps from the handoff', () => {
  it.each([
    ['protein', 5],
    ['carb', 5],
    ['fat', 5],
    ['fiber', 1],
    ['water', 1],
    ['steps', 500],
  ] as [FieldKey, number][])('%s steps by %i', (key, step) => {
    const spec = field(key);
    // Start well inside the field's own range — water caps at 20 litres, so a
    // shared base of 100 would clamp instead of stepping.
    const base = Math.floor(spec.max / 2);
    expect(bump(spec, base, 1) - base).toBe(step);
    expect(base - bump(spec, base, -1)).toBe(step);
  });

  it('floors at zero rather than going negative', () => {
    expect(bump(field('fiber'), 0, -1)).toBe(0);
    expect(bump(field('steps'), 200, -1)).toBe(0);
  });

  it('caps at the field maximum', () => {
    const spec = field('water');
    expect(bump(spec, spec.max, 1)).toBe(spec.max);
  });

  it('keeps whole numbers whole', () => {
    expect(Number.isInteger(bump(field('protein'), 170, 1))).toBe(true);
  });

  it('keeps water free of float drift', () => {
    // 0.1 + 0.2 style drift would surface as 3.0000000000000004 in the UI.
    let value = 0.5;
    for (let i = 0; i < 5; i += 1) value = bump(field('water'), value, 1);
    expect(value).toBe(5.5);
  });
});

describe('macroPercent', () => {
  it('uses 4 kcal per gram for protein and carbs', () => {
    // 170 g × 4 = 680 kcal of 2200 → 31%
    expect(macroPercent(170, 4, 2200)).toBe(31);
  });

  it('uses 9 kcal per gram for fat', () => {
    // 65 g × 9 = 585 of 2200 → 27%
    expect(macroPercent(65, 9, 2200)).toBe(27);
  });

  it('returns zero rather than dividing by zero', () => {
    expect(macroPercent(170, 4, 0)).toBe(0);
  });

  it('moves as the calorie target changes', () => {
    expect(macroPercent(170, 4, 2200)).toBeGreaterThan(macroPercent(170, 4, 3000));
  });
});

describe('toDraft', () => {
  it('reads an existing plan back exactly', () => {
    const draft = toDraft(plan());

    expect(draft.kcal).toBe(2200);
    expect(draft.values).toEqual({
      protein: 170,
      carb: 210,
      fat: 65,
      fiber: 30,
      water: 3,
      steps: 8000,
    });
    expect(draft.meals).toHaveLength(1);
  });

  it('substitutes defaults for optional targets the trainer never set', () => {
    const draft = toDraft(plan({ fiberMinG: null, waterMinL: null, stepsMin: null }));

    expect(draft.values.fiber).toBe(30);
    expect(draft.values.water).toBe(3);
    expect(draft.values.steps).toBe(8000);
  });

  it('opens a new plan on the handoff seed values with one blank meal row', () => {
    const draft = toDraft(null);

    expect(draft.kcal).toBe(2200);
    expect(draft.meals).toHaveLength(1);
    expect(draft.meals[0].name).toBe('');
  });
});

describe('toPayload', () => {
  it('maps the draft onto the API field names', () => {
    expect(toPayload(toDraft(plan()))).toMatchObject({
      dailyCalories: 2200,
      proteinG: 170,
      carbsG: 210,
      fatG: 65,
      fiberMinG: 30,
      waterMinL: 3,
      stepsMin: 8000,
    });
  });

  it('drops meal rows the trainer left unnamed', () => {
    const draft = toDraft(null);
    const payload = toPayload(draft);

    expect(payload.meals).toEqual([]);
  });

  it('trims meal text', () => {
    const draft = toDraft(null);
    draft.meals = [{ key: 'k', name: '  فطور  ', description: '  شوفان  ' }];

    expect(toPayload(draft).meals).toEqual([{ name: 'فطور', description: 'شوفان' }]);
  });

  it('keeps a named meal that has no description yet', () => {
    const draft = toDraft(null);
    draft.meals = [{ key: 'k', name: 'فطور', description: '' }];

    expect(toPayload(draft).meals).toEqual([{ name: 'فطور', description: '' }]);
  });
});

describe('hasChanges', () => {
  it('is false for an untouched plan', () => {
    expect(hasChanges(plan(), toDraft(plan()))).toBe(false);
  });

  it('is true for a client with no plan yet', () => {
    expect(hasChanges(null, toDraft(null))).toBe(true);
  });

  it('notices a calorie change', () => {
    const draft = toDraft(plan());
    draft.kcal = 2250;

    expect(hasChanges(plan(), draft)).toBe(true);
  });

  it('notices an edited meal', () => {
    const draft = toDraft(plan());
    draft.meals[0].description = 'شوفان وبيض وموز';

    expect(hasChanges(plan(), draft)).toBe(true);
  });

  it('ignores a blank meal row being added, since it is never saved', () => {
    const draft = toDraft(plan());
    draft.meals.push({ key: 'new', name: '', description: '' });

    expect(hasChanges(plan(), draft)).toBe(false);
  });
});
