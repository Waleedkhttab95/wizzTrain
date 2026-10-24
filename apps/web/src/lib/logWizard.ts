import type { DailyLogView, NutritionPlanView } from '@wizzapp/shared';

/**
 * The ten-step daily log — the client app's core flow. One field per screen so
 * it can be finished in under a minute on a phone.
 *
 * Steps and decimal places come straight from the handoff; each field also
 * carries four quick-delta chips for the common adjustments.
 */

export type FieldKey =
  | 'weight'
  | 'kcal'
  | 'protein'
  | 'carb'
  | 'fat'
  | 'fiber'
  | 'water'
  | 'sleep'
  | 'steps'
  | 'note';

export interface FieldSpec {
  key: FieldKey;
  question: string;
  hint: string;
  unit: string;
  step: number;
  decimals: number;
  quick: number[];
  min: number;
  max: number;
  /** The DailyLog property this writes to; `note` is handled separately. */
  field: keyof DailyLogView | null;
}

export const FIELDS: FieldSpec[] = [
  { key: 'weight', question: 'وزنك اليوم؟', hint: 'الصبح على الفاضي أفضل قياس', unit: 'كجم', step: 0.1, decimals: 1, quick: [-0.5, -0.2, 0.2, 0.5], min: 30, max: 300, field: 'weightKg' },
  { key: 'kcal', question: 'كم سعرة أكلت؟', hint: '', unit: 'سعرة', step: 50, decimals: 0, quick: [-200, -100, 100, 200], min: 0, max: 20000, field: 'caloriesActual' },
  { key: 'protein', question: 'البروتين؟', hint: '', unit: 'جرام', step: 5, decimals: 0, quick: [-20, -10, 10, 20], min: 0, max: 1000, field: 'proteinGActual' },
  { key: 'carb', question: 'الكارب؟', hint: '', unit: 'جرام', step: 5, decimals: 0, quick: [-20, -10, 10, 20], min: 0, max: 2000, field: 'carbsGActual' },
  { key: 'fat', question: 'الفات؟', hint: '', unit: 'جرام', step: 5, decimals: 0, quick: [-10, -5, 5, 10], min: 0, max: 1000, field: 'fatGActual' },
  { key: 'fiber', question: 'الألياف؟', hint: '', unit: 'جرام', step: 2, decimals: 0, quick: [-4, -2, 2, 4], min: 0, max: 300, field: 'fiberGActual' },
  { key: 'water', question: 'كم شربت ماء؟', hint: '', unit: 'لتر', step: 0.25, decimals: 2, quick: [-0.5, -0.25, 0.25, 0.5], min: 0, max: 20, field: 'waterLActual' },
  { key: 'sleep', question: 'كم نمت؟', hint: 'ساعات النوم أمس', unit: 'ساعة', step: 0.5, decimals: 1, quick: [-1, -0.5, 0.5, 1], min: 0, max: 24, field: 'sleepHours' },
  { key: 'steps', question: 'عدد خطواتك؟', hint: '', unit: 'خطوة', step: 500, decimals: 0, quick: [-2000, -1000, 1000, 2000], min: 0, max: 200000, field: 'stepsActual' },
  { key: 'note', question: 'أي ملاحظة لمدربك؟', hint: 'اختياري — سطر واحد يكفي', unit: '', step: 0, decimals: 0, quick: [], min: 0, max: 0, field: null },
];

export const NOTE_CHIPS = ['نمت متأخر', 'التمرين كان ثقيل', 'أكلت خارج البيت', 'كل شي تمام'];

/** Sensible starting values when there is nothing to carry over. */
const FALLBACK: Record<Exclude<FieldKey, 'note'>, number> = {
  weight: 80,
  kcal: 2000,
  protein: 150,
  carb: 200,
  fat: 65,
  fiber: 25,
  water: 2.5,
  sleep: 7,
  steps: 8000,
};

/** The hint under each question, filled in from the client's own targets. */
export function hintFor(spec: FieldSpec, plan: NutritionPlanView | null): string {
  if (spec.hint) return spec.hint;
  if (!plan) return '';

  const targets: Partial<Record<FieldKey, string>> = {
    kcal: `الهدف ${plan.dailyCalories.toLocaleString('en-US')}`,
    protein: `الهدف ${plan.proteinG} g`,
    carb: `الهدف ${plan.carbsG} g`,
    fat: `الهدف ${plan.fatG} g`,
    fiber: plan.fiberMinG ? `حد أدنى ${plan.fiberMinG} g` : '',
    water: plan.waterMinL ? `حد أدنى ${plan.waterMinL} لتر` : '',
    steps: plan.stepsMin ? `حد أدنى ${plan.stepsMin.toLocaleString('en-US')}` : '',
  };

  return targets[spec.key] ?? '';
}

export type Values = Partial<Record<FieldKey, number>>;

/**
 * Seeds the wizard. A field the client already filled in for this date wins;
 * otherwise it carries over their previous entry so the steppers start near
 * the right number rather than at an arbitrary default.
 */
export function seedValues(existing: DailyLogView | null, previous: DailyLogView | null): Values {
  const values: Values = {};

  for (const spec of FIELDS) {
    if (spec.field === null) continue;

    const fromToday = existing?.[spec.field];
    if (typeof fromToday === 'number') {
      values[spec.key] = fromToday;
      continue;
    }

    const fromPrevious = previous?.[spec.field];
    values[spec.key] =
      typeof fromPrevious === 'number'
        ? fromPrevious
        : FALLBACK[spec.key as Exclude<FieldKey, 'note'>];
  }

  return values;
}

/** Rounds to the field's precision and clamps to its range. */
export function clampTo(spec: FieldSpec, value: number): number {
  const bounded = Math.min(Math.max(value, spec.min), spec.max);
  return spec.decimals === 0
    ? Math.round(bounded)
    : Number(bounded.toFixed(spec.decimals));
}

export function adjust(spec: FieldSpec, current: number, delta: number): number {
  return clampTo(spec, current + delta);
}

/** Display string for the big numeral — Western digits, field precision. */
export function formatValue(spec: FieldSpec, value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: spec.decimals === 2 ? 2 : 0,
    maximumFractionDigits: spec.decimals,
  });
}

/** "آخر تسجيل: 95.4" under the stepper, or empty when there is no history. */
export function compareLine(spec: FieldSpec, previous: DailyLogView | null): string {
  if (!previous || spec.field === null) return '';
  const value = previous[spec.field];
  if (typeof value !== 'number') return '';
  return `آخر تسجيل: ${formatValue(spec, value)}`;
}

/**
 * The request body. Only fields the client actually visited are sent — and
 * because the API replaces the whole day, anything skipped this time but
 * present on the stored record is carried through so it isn't wiped.
 */
export function buildPayload(
  logDate: string,
  values: Values,
  note: string,
  skipped: Set<FieldKey>,
  existing: DailyLogView | null,
): Record<string, unknown> {
  const body: Record<string, unknown> = { logDate };

  for (const spec of FIELDS) {
    if (spec.field === null) continue;

    if (skipped.has(spec.key)) {
      // Skipping leaves whatever was already stored for that day untouched.
      const stored = existing?.[spec.field];
      if (typeof stored === 'number') body[spec.field] = stored;
      continue;
    }

    const value = values[spec.key];
    if (typeof value === 'number') body[spec.field] = value;
  }

  const trimmed = note.trim();
  if (trimmed) body.notes = trimmed;
  else if (skipped.has('note') && existing?.notes) body.notes = existing.notes;

  return body;
}
