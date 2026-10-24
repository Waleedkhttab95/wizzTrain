'use client';

import type { ClientProfile } from '@wizzapp/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHead } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, TextArea } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Stat';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { decimal, num } from '@/lib/format';

interface MealDraft {
  name: string;
  description: string;
}

/**
 * Targets and meals in one form. Creating a plan supersedes the previous one,
 * and PATCH replaces the whole meal list — so the form always carries the
 * complete plan, never a delta.
 */
export function NutritionEditor({
  client,
  onChanged,
}: {
  client: ClientProfile;
  onChanged: () => void;
}) {
  const { notify } = useToast();
  const plan = client.activeNutritionPlan;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    dailyCalories: String(plan?.dailyCalories ?? ''),
    proteinG: String(plan?.proteinG ?? ''),
    carbsG: String(plan?.carbsG ?? ''),
    fatG: String(plan?.fatG ?? ''),
    fiberMinG: plan?.fiberMinG != null ? String(plan.fiberMinG) : '',
    waterMinL: plan?.waterMinL != null ? String(plan.waterMinL) : '',
    stepsMin: plan?.stepsMin != null ? String(plan.stepsMin) : '',
  });
  const [meals, setMeals] = useState<MealDraft[]>(
    plan?.meals.map((meal) => ({ name: meal.name, description: meal.description })) ?? [],
  );

  function set(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing() {
    setForm({
      dailyCalories: String(plan?.dailyCalories ?? ''),
      proteinG: String(plan?.proteinG ?? ''),
      carbsG: String(plan?.carbsG ?? ''),
      fatG: String(plan?.fatG ?? ''),
      fiberMinG: plan?.fiberMinG != null ? String(plan.fiberMinG) : '',
      waterMinL: plan?.waterMinL != null ? String(plan.waterMinL) : '',
      stepsMin: plan?.stepsMin != null ? String(plan.stepsMin) : '',
    });
    setMeals(plan?.meals.map((meal) => ({ name: meal.name, description: meal.description })) ?? []);
    setErrors([]);
    setEditing(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors([]);

    const body: Record<string, unknown> = {
      dailyCalories: Number(form.dailyCalories),
      proteinG: Number(form.proteinG),
      carbsG: Number(form.carbsG),
      fatG: Number(form.fatG),
      meals: meals
        .filter((meal) => meal.name.trim() !== '')
        .map((meal) => ({ name: meal.name.trim(), description: meal.description.trim() })),
    };
    if (form.fiberMinG) body.fiberMinG = Number(form.fiberMinG);
    if (form.waterMinL) body.waterMinL = Number(form.waterMinL);
    if (form.stepsMin) body.stepsMin = Number(form.stepsMin);

    try {
      // A new plan on first setup; an in-place update afterwards, so the
      // client's existing plan id and history stay put.
      if (plan) {
        await api.patch(`/nutrition-plan/${plan.id}`, body);
      } else {
        await api.post(`/clients/${client.id}/nutrition-plan`, body);
      }
      notify(plan ? 'تم تحديث الخطة' : 'تم إنشاء الخطة');
      setEditing(false);
      onChanged();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fieldMessages.length > 0 ? caught.fieldMessages : [caught.message]);
      } else {
        setErrors(['تعذّر حفظ الخطة']);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!plan && !editing) {
    return (
      <EmptyState
        title="لا توجد خطة غذائية"
        body="حدّد السعرات والماكروز والوجبات — سيراها المتدرب فورًا."
        action={
          <Button variant="blaze" onClick={startEditing}>
            إنشاء خطة غذائية
          </Button>
        }
      />
    );
  }

  if (!editing && plan) {
    return (
      <div className="flex flex-col gap-4">
        <Card raised>
          <CardHead
            title="الأهداف اليومية"
            label="DAILY TARGETS"
            action={
              <Button variant="ghost" size="sm" onClick={startEditing}>
                تعديل
              </Button>
            }
          />
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-y divide-line-soft sm:grid-cols-4 sm:divide-y-0">
            <div className="p-5">
              <Stat label="CALORIES" value={num(plan.dailyCalories)} size="sm" tone="blaze" />
            </div>
            <div className="p-5">
              <Stat label="PROTEIN" value={num(plan.proteinG)} unit="جم" size="sm" />
            </div>
            <div className="p-5">
              <Stat label="CARBS" value={num(plan.carbsG)} unit="جم" size="sm" />
            </div>
            <div className="p-5">
              <Stat label="FAT" value={num(plan.fatG)} unit="جم" size="sm" />
            </div>
          </div>
          {(plan.fiberMinG !== null || plan.waterMinL !== null || plan.stepsMin !== null) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft px-5 py-3.5 text-[13px] text-muted">
              {plan.fiberMinG !== null && (
                <span className="tnum">ألياف {num(plan.fiberMinG)} جم</span>
              )}
              {plan.waterMinL !== null && (
                <span className="tnum">ماء {decimal(plan.waterMinL)} لتر</span>
              )}
              {plan.stepsMin !== null && <span className="tnum">خطوات {num(plan.stepsMin)}</span>}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="الوجبات" label={`${plan.meals.length} MEALS`} />
          {plan.meals.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-faint">لا توجد وجبات محددة.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {plan.meals.map((meal) => (
                <li key={meal.id} className="px-5 py-4">
                  <h3 className="text-[14.5px] font-bold">{meal.name}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-wrap text-muted">
                    {meal.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {errors.map((message) => (
        <div key={message} className="rounded-xl border border-bad/30 bg-bad-ghost px-4 py-3">
          <p className="text-[14px] font-medium text-bad">{message}</p>
        </div>
      ))}

      <Card>
        <CardHead title="الماكروز" label="REQUIRED" />
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <Field
            label="السعرات"
            suffix="KCAL"
            type="number"
            inputMode="numeric"
            placeholder="2000"
            value={form.dailyCalories}
            onChange={(e) => set('dailyCalories', e.target.value)}
            required
          />
          <Field
            label="بروتين"
            suffix="G"
            type="number"
            inputMode="numeric"
            placeholder="150"
            value={form.proteinG}
            onChange={(e) => set('proteinG', e.target.value)}
            required
          />
          <Field
            label="كربوهيدرات"
            suffix="G"
            type="number"
            inputMode="numeric"
            placeholder="200"
            value={form.carbsG}
            onChange={(e) => set('carbsG', e.target.value)}
            required
          />
          <Field
            label="دهون"
            suffix="G"
            type="number"
            inputMode="numeric"
            placeholder="60"
            value={form.fatG}
            onChange={(e) => set('fatG', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card>
        <CardHead title="أهداف إضافية" label="OPTIONAL" />
        <div className="grid grid-cols-3 gap-4 p-5">
          <Field
            label="ألياف"
            suffix="G"
            type="number"
            inputMode="numeric"
            placeholder="30"
            value={form.fiberMinG}
            onChange={(e) => set('fiberMinG', e.target.value)}
          />
          <Field
            label="ماء"
            suffix="L"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="3"
            value={form.waterMinL}
            onChange={(e) => set('waterMinL', e.target.value)}
          />
          <Field
            label="خطوات"
            suffix="STEPS"
            type="number"
            inputMode="numeric"
            placeholder="8000"
            value={form.stepsMin}
            onChange={(e) => set('stepsMin', e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <CardHead
          title="الوجبات"
          label="MEALS"
          action={
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setMeals((current) => [...current, { name: '', description: '' }])}
            >
              + وجبة
            </Button>
          }
        />
        {meals.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-faint">
            لا وجبات — الأهداف اليومية وحدها كافية.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {meals.map((meal, index) => (
              <li key={index} className="flex flex-col gap-3 p-5">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field
                      label={`الوجبة ${index + 1}`}
                      placeholder="الإفطار"
                      value={meal.name}
                      onChange={(e) =>
                        setMeals((current) =>
                          current.map((m, i) => (i === index ? { ...m, name: e.target.value } : m)),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setMeals((current) => current.filter((_, i) => i !== index))}
                    aria-label={`حذف الوجبة ${index + 1}`}
                  >
                    حذف
                  </Button>
                </div>
                <TextArea
                  label="التفاصيل"
                  placeholder="شوفان 60 جم + 3 بيضات"
                  value={meal.description}
                  onChange={(e) =>
                    setMeals((current) =>
                      current.map((m, i) => (i === index ? { ...m, description: e.target.value } : m)),
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-2">
        <Button type="submit" variant="blaze" loading={saving} full>
          {plan ? 'حفظ التعديلات' : 'إنشاء الخطة'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
