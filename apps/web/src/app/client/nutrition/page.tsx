'use client';

import type { DailyLogView, NutritionPlanView } from '@wizzapp/shared';
import { Donut, HaveGoal, percentOf } from '@/components/client/Donut';
import { EmptyState, ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { ApiError, api } from '@/lib/api';
import { decimal, num, todayIso } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { palette } from '@/lib/palette';

export default function ClientNutritionPage() {
  const today = todayIso();

  const plan = useApi<NutritionPlanView>(
    (signal) => api.get<NutritionPlanView>('/nutrition-plan/active', undefined, signal),
    [],
  );

  const log = useApi<DailyLogView | null>(
    (signal) =>
      api.get<DailyLogView>(`/daily-logs/me/${today}`, undefined, signal).catch((error: unknown) => {
        // Nothing logged yet today is the normal morning state.
        if (error instanceof ApiError && error.isNotFound) return null;
        throw error;
      }),
    [today],
  );

  if (plan.loading) return <Loading />;

  if (plan.error?.isNotFound) {
    return (
      <div className="p-5">
        <EmptyState
          title="ما فيه خطة غذائية بعد"
          body="بتلاقي أهدافك اليومية ووجباتك هنا أول ما مدربك يجهّزها."
        />
      </div>
    );
  }

  if (plan.error || !plan.data) {
    return (
      <div className="p-5">
        <ErrorNote message={plan.error?.message ?? 'تعذّر تحميل الخطة'} onRetry={plan.reload} />
      </div>
    );
  }

  const p = plan.data;
  const eaten = log.data?.caloriesActual ?? null;
  const kcalPct = percentOf(eaten, p.dailyCalories);
  const remaining = eaten === null ? p.dailyCalories : Math.max(0, p.dailyCalories - eaten);

  // Each ring is captioned with its own name, so colour carries magnitude
  // rather than identity: one hue throughout, green only once a target is
  // met. Three warm hues of equal lightness would be indistinguishable to a
  // red-blind reader anyway.
  const rings = [
    { label: 'بروتين', have: log.data?.proteinGActual ?? null, goal: p.proteinG, unit: 'g' },
    { label: 'كارب', have: log.data?.carbsGActual ?? null, goal: p.carbsG, unit: 'g' },
    { label: 'فات', have: log.data?.fatGActual ?? null, goal: p.fatG, unit: 'g' },
  ];

  const minimums = [
    { label: 'ألياف', have: log.data?.fiberGActual ?? null, goal: p.fiberMinG, unit: 'g' },
    { label: 'ماء', have: log.data?.waterLActual ?? null, goal: p.waterMinL, unit: 'لتر' },
    { label: 'خطوات', have: log.data?.stepsActual ?? null, goal: p.stepsMin, unit: '' },
  ].filter((bar) => bar.goal !== null);

  return (
    <div className="flex flex-col gap-3.5 px-5 pt-[26px] pb-2">
      <header>
        <p className="text-[13.5px] font-semibold text-text-muted">خطة التغذية</p>
        <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-[1.2] font-bold">
          أهدافك اليومية
        </h1>
      </header>

      <section className="flex items-center gap-4 rounded-[16px] bg-accent p-5.5 text-accent-ink shadow-[0_2px_6px_rgba(44,24,16,.12)]">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold opacity-90">السعرات المستهدفة</p>
          <p className="font-[family-name:var(--font-display)] text-[50px] leading-[1.05] font-bold">
            <Num>{num(p.dailyCalories)}</Num>
          </p>
          <p className="text-[13.5px] opacity-90">
            {eaten === null ? (
              'ما سجّلت أكلك اليوم'
            ) : (
              <>
                أكلت اليوم <Num>{num(eaten)}</Num> · باقي <Num>{num(remaining)}</Num>
              </>
            )}
          </p>
        </div>
        <Donut
          size={86}
          radius={35}
          stroke={10}
          percent={kcalPct}
          // This ring sits on the accent band, where the rest of the type is
          // white; the darker ink used elsewhere does not carry on orange.
          color={palette.accentInk}
          trackColor="rgba(255,255,255,.28)"
          label={`${kcalPct}%`}
          labelColor={palette.accentInk}
          labelSize={19}
        />
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        {rings.map((ring) => {
          const pct = percentOf(ring.have, ring.goal);
          return (
            <div
              key={ring.label}
              className="flex flex-col items-center gap-1.5 rounded-[16px] bg-surface px-2.5 py-3.5"
            >
              <Donut
                size={76}
                radius={30}
                stroke={9}
                percent={pct}
                color={pct >= 100 ? palette.success : palette.accent}
                trackColor={palette.surfaceAlt}
                label={`${pct}%`}
                labelColor={palette.text}
                labelSize={17}
              />
              <p className="text-[13.5px] font-bold">{ring.label}</p>
              <HaveGoal have={ring.have} goal={ring.goal} unit={ring.unit} />
            </div>
          );
        })}
      </div>

      {minimums.length > 0 && (
        <section className="flex flex-col gap-3.5 rounded-[16px] bg-surface p-4.5">
          {minimums.map((bar) => {
            const pct = percentOf(bar.have, bar.goal);
            return (
              <div key={bar.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13.5px] font-semibold">
                  <span>
                    {bar.label}
                    {pct >= 100 && <span className="text-lime"> ✓ تحقّق</span>}
                  </span>
                  <Num className="text-text-muted">
                    {`${bar.have === null ? '—' : decimal(bar.have)} / ${decimal(bar.goal)} ${bar.unit}`.trim()}
                  </Num>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${pct >= 100 ? 'bg-lime' : 'bg-accent'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {p.meals.length > 0 && (
        <section className="flex flex-col gap-3 rounded-[16px] bg-lime-tint p-5">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-lime-ink-strong">
            وجبات مقترحة
          </h2>
          {p.meals.map((meal) => (
            <div key={meal.id} className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3.5">
              <p className="text-[15px] font-bold">{meal.name}</p>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-text-muted">
                {meal.description}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
