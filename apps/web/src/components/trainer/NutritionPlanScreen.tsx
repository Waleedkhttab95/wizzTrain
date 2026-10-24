'use client';

import type { ClientProfile, NutritionPlanView } from '@wizzapp/shared';
import { useEffect, useRef, useState } from 'react';
import { ErrorNote } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import {
  FIELDS,
  KCAL_FLOOR,
  MACROS,
  bump,
  bumpKcal,
  hasChanges,
  macroPercent,
  newMeal,
  toDraft,
  toPayload,
  type FieldKey,
  type FieldSpec,
  type NutritionDraft,
} from './nutritionDraft';

export function NutritionPlanScreen({
  client,
  onSaved,
}: {
  client: ClientProfile;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const plan = client.activeNutritionPlan;

  const [draft, setDraft] = useState<NutritionDraft>(() => toDraft(plan));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed if the plan underneath changes (after a save).
  const loadedId = useRef(plan?.id ?? null);
  useEffect(() => {
    if (loadedId.current !== (plan?.id ?? null)) {
      loadedId.current = plan?.id ?? null;
      setDraft(toDraft(plan));
    }
  }, [plan]);

  const dirty = hasChanges(plan, draft);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function setValue(key: FieldKey, value: number) {
    setDraft((current) => ({ ...current, values: { ...current.values, [key]: value } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = toPayload(draft);
      // A first plan is created; an existing one is updated in place so the
      // client keeps the same plan id and history.
      if (plan) {
        await api.patch<NutritionPlanView>(`/nutrition-plan/${plan.id}`, body);
      } else {
        await api.post<NutritionPlanView>(`/clients/${client.id}/nutrition-plan`, body);
      }
      notify(plan ? 'تم حفظ الخطة' : 'تم إنشاء الخطة');
      onSaved();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? (caught.fieldMessages[0] ?? caught.message)
          : 'تعذّر حفظ الخطة';
      setError(message);
      notify(message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {dirty ? (
          <span className="rounded-full bg-accent-tint px-3 py-1.5 text-[12.5px] font-semibold text-accent-tint-ink">
            تغييرات غير محفوظة
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex h-[50px] items-center rounded-full bg-lime-strong px-[26px] font-[family-name:var(--font-display)] text-[17px] font-bold text-lime-tint transition-colors hover:bg-lime-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? 'جارٍ الحفظ…' : 'حفظ الخطة'}
        </button>
      </div>

      {error && <ErrorNote message={error} />}

      {/* Calories hero — the number everything else is a share of. */}
      <section className="flex flex-wrap items-center gap-6 rounded-[16px] bg-accent-tint p-6">
        <div className="min-w-[220px] flex-1">
          <p className="text-[14px] font-semibold text-accent-pressed">السعرات اليومية</p>
          <div className="mt-1.5 flex items-center gap-3.5">
            <StepperButton
              onClick={() => setDraft((c) => ({ ...c, kcal: bumpKcal(c.kcal, -1) }))}
              disabled={draft.kcal <= KCAL_FLOOR}
              label="إنقاص السعرات"
              size={52}
              tone="accent"
            >
              −
            </StepperButton>
            <Num
              className="min-w-[120px] text-center font-[family-name:var(--font-display)] text-[46px] font-bold text-accent-tint-ink"
              aria-live="polite"
            >
              {draft.kcal.toLocaleString('en-US')}
            </Num>
            <StepperButton
              onClick={() => setDraft((c) => ({ ...c, kcal: bumpKcal(c.kcal, 1) }))}
              label="زيادة السعرات"
              size={52}
              tone="accent"
            >
              +
            </StepperButton>
          </div>
          {draft.kcal <= KCAL_FLOOR && (
            <p className="mt-2 text-[12.5px] text-accent-pressed">
              الحد الأدنى الآمن <Num>{KCAL_FLOOR.toLocaleString('en-US')}</Num> سعرة.
            </p>
          )}
        </div>

        {/* Live share of calories, recomputed as the steppers move. */}
        <div className="flex flex-wrap gap-3">
          {MACROS.map((macro) => (
            <div key={macro.key} className="min-w-[110px] rounded-[14px] bg-surface px-[18px] py-3.5">
              <p className="text-[13px] font-semibold text-text-muted">{macro.label}</p>
              <p className="font-[family-name:var(--font-display)] text-[24px] font-bold">
                <Num>{draft.values[macro.key]}</Num> g
              </p>
              <p className="text-[12px] text-text-faint">
                <Num>{macroPercent(draft.values[macro.key], macro.kcalPerGram, draft.kcal)}%</Num> من
                السعرات
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[16px] bg-surface p-6 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {FIELDS.map((spec) => (
          <StepperField
            key={spec.key}
            spec={spec}
            value={draft.values[spec.key]}
            onChange={(value) => setValue(spec.key, value)}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3.5 rounded-[16px] bg-lime-tint p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold text-lime-ink-strong">
          الوجبات
        </h2>

        {draft.meals.map((meal, index) => (
          <div
            key={meal.key}
            className="flex flex-wrap items-center gap-2.5 rounded-[14px] bg-surface p-3"
          >
            <input
              value={meal.name}
              onChange={(e) =>
                setDraft((c) => ({
                  ...c,
                  meals: c.meals.map((m) =>
                    m.key === meal.key ? { ...m, name: e.target.value } : m,
                  ),
                }))
              }
              placeholder="اسم الوجبة"
              aria-label={`اسم الوجبة ${index + 1}`}
              className="h-11 min-w-0 rounded-full border border-border bg-input-bg px-4 text-[15px] font-semibold transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none [flex:1_1_130px]"
            />
            <input
              value={meal.description}
              onChange={(e) =>
                setDraft((c) => ({
                  ...c,
                  meals: c.meals.map((m) =>
                    m.key === meal.key ? { ...m, description: e.target.value } : m,
                  ),
                }))
              }
              placeholder="الوصف: 150 جم صدر دجاج + كوب رز + سلطة"
              aria-label={`وصف الوجبة ${index + 1}`}
              className="h-11 min-w-0 rounded-full border border-border bg-input-bg px-4 text-[14.5px] transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none [flex:3_1_180px]"
            />
            <button
              onClick={() =>
                setDraft((c) => ({ ...c, meals: c.meals.filter((m) => m.key !== meal.key) }))
              }
              title="حذف الوجبة"
              aria-label={`حذف ${meal.name || `الوجبة ${index + 1}`}`}
              className="grid size-10 flex-none place-items-center rounded-full bg-surface-alt text-[18px] text-accent-pressed transition-colors hover:bg-accent-tint-2"
            >
              ×
            </button>
          </div>
        ))}

        {draft.meals.length === 0 && (
          <p className="text-[14px] text-lime-ink">
            بدون وجبات محددة — الأهداف اليومية وحدها كافية.
          </p>
        )}

        <button
          onClick={() => setDraft((c) => ({ ...c, meals: [...c.meals, newMeal()] }))}
          className="h-[46px] self-start rounded-full border border-dashed border-lime-deep px-[22px] text-[15px] font-semibold text-lime-strong transition-colors hover:bg-lime-tint-2"
        >
          + إضافة وجبة
        </button>
      </section>
    </div>
  );
}

function StepperField({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold">{spec.label}</p>
      <div className="flex items-center gap-2 rounded-full bg-bg p-1.5">
        <StepperButton
          onClick={() => onChange(bump(spec, value, -1))}
          disabled={value <= 0}
          label={`إنقاص ${spec.label}`}
        >
          −
        </StepperButton>
        <Num
          className="flex-1 text-center font-[family-name:var(--font-display)] text-[22px] font-bold"
          aria-live="polite"
        >
          {value.toLocaleString('en-US')}
        </Num>
        <StepperButton
          onClick={() => onChange(bump(spec, value, 1))}
          disabled={value >= spec.max}
          label={`زيادة ${spec.label}`}
        >
          +
        </StepperButton>
      </div>
      <p className="text-[12.5px] text-text-faint">{spec.hint}</p>
    </div>
  );
}

function StepperButton({
  children,
  onClick,
  disabled,
  label,
  size = 40,
  tone = 'plain',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  size?: number;
  tone?: 'plain' | 'accent';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ width: size, height: size }}
      className={cn(
        'grid flex-none place-items-center rounded-full font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        size >= 52 ? 'text-[26px]' : 'text-[20px]',
        tone === 'accent'
          ? 'bg-accent-tint-2 text-accent-tint-ink hover:bg-accent-tint-3'
          : 'bg-surface-alt text-text hover:bg-border',
      )}
    >
      {children}
    </button>
  );
}
