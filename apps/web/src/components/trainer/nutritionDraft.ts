import type { NutritionPlanView } from '@wizzapp/shared';

/**
 * The nutrition editor works on a local draft and commits it with one "حفظ
 * الخطة". Unlike the program builder this needs no diff — the API takes the
 * whole plan in a single call, and a PATCH replaces the meal list wholesale.
 */

/** Calories: step and floor come straight from the handoff. */
export const KCAL_STEP = 50;
export const KCAL_FLOOR = 1200;
/** The API rejects anything above this. */
export const KCAL_CEILING = 10_000;

export type FieldKey = 'protein' | 'carb' | 'fat' | 'fiber' | 'water' | 'steps';

export interface FieldSpec {
  key: FieldKey;
  label: string;
  hint: string;
  step: number;
  max: number;
  /** Water is the one field that carries a decimal. */
  decimals: number;
}

export const FIELDS: FieldSpec[] = [
  { key: 'protein', label: 'بروتين (g)', hint: '≈ 2 g لكل كجم', step: 5, max: 1000, decimals: 0 },
  { key: 'carb', label: 'كارب (g)', hint: 'قبل التمرين أعلى', step: 5, max: 2000, decimals: 0 },
  { key: 'fat', label: 'فات (g)', hint: 'حد أدنى 55', step: 5, max: 1000, decimals: 0 },
  { key: 'fiber', label: 'ألياف (g) — حد أدنى', hint: 'من الخضار والفواكه', step: 1, max: 300, decimals: 0 },
  { key: 'water', label: 'ماء (لتر) — حد أدنى', hint: 'زوّدها بأيام التمرين', step: 1, max: 20, decimals: 2 },
  { key: 'steps', label: 'خطوات — حد أدنى', hint: 'نشاط يومي خارج التمرين', step: 500, max: 100_000, decimals: 0 },
];

export interface MealDraft {
  key: string;
  name: string;
  description: string;
}

export interface NutritionDraft {
  kcal: number;
  values: Record<FieldKey, number>;
  meals: MealDraft[];
}

let counter = 0;
export function newMeal(): MealDraft {
  counter += 1;
  return { key: `meal-${counter}`, name: '', description: '' };
}

/** The defaults a brand-new plan opens with, per the handoff's seed values. */
const DEFAULTS: Record<FieldKey, number> = {
  protein: 170,
  carb: 210,
  fat: 65,
  fiber: 30,
  water: 3,
  steps: 8000,
};

export function toDraft(plan: NutritionPlanView | null): NutritionDraft {
  if (!plan) {
    return { kcal: 2200, values: { ...DEFAULTS }, meals: [newMeal()] };
  }

  return {
    kcal: plan.dailyCalories,
    values: {
      protein: plan.proteinG,
      carb: plan.carbsG,
      fat: plan.fatG,
      // These three are optional on the plan; fall back to the defaults so the
      // steppers always have something to increment.
      fiber: plan.fiberMinG ?? DEFAULTS.fiber,
      water: plan.waterMinL ?? DEFAULTS.water,
      steps: plan.stepsMin ?? DEFAULTS.steps,
    },
    meals: plan.meals.map((meal) => ({
      key: `meal-${meal.id}`,
      name: meal.name,
      description: meal.description,
    })),
  };
}

/** Clamps a stepper to its field's bounds, avoiding float drift on water. */
export function bump(spec: FieldSpec, current: number, direction: 1 | -1): number {
  const next = current + spec.step * direction;
  const clamped = Math.min(Math.max(next, 0), spec.max);
  return spec.decimals === 0 ? Math.round(clamped) : Number(clamped.toFixed(spec.decimals));
}

export function bumpKcal(current: number, direction: 1 | -1): number {
  const next = current + KCAL_STEP * direction;
  return Math.min(Math.max(next, KCAL_FLOOR), KCAL_CEILING);
}

/**
 * Share of the day's calories a macro accounts for. Protein and carbs are
 * 4 kcal per gram, fat is 9 — the handoff shows this live as the trainer
 * adjusts the steppers.
 */
export function macroPercent(grams: number, kcalPerGram: number, dailyCalories: number): number {
  if (dailyCalories <= 0) return 0;
  return Math.round((grams * kcalPerGram * 100) / dailyCalories);
}

export const MACROS = [
  { key: 'protein' as const, label: 'بروتين', kcalPerGram: 4 },
  { key: 'carb' as const, label: 'كارب', kcalPerGram: 4 },
  { key: 'fat' as const, label: 'فات', kcalPerGram: 9 },
];

/** The body both POST and PATCH accept. Blank meals are dropped, not saved. */
export function toPayload(draft: NutritionDraft): Record<string, unknown> {
  return {
    dailyCalories: draft.kcal,
    proteinG: draft.values.protein,
    carbsG: draft.values.carb,
    fatG: draft.values.fat,
    fiberMinG: draft.values.fiber,
    waterMinL: draft.values.water,
    stepsMin: draft.values.steps,
    meals: draft.meals
      .filter((meal) => meal.name.trim() !== '')
      .map((meal) => ({ name: meal.name.trim(), description: meal.description.trim() })),
  };
}

/** Whether saving would change anything the server already holds. */
export function hasChanges(plan: NutritionPlanView | null, draft: NutritionDraft): boolean {
  if (!plan) return true;
  return JSON.stringify(toPayload(toDraft(plan))) !== JSON.stringify(toPayload(draft));
}
