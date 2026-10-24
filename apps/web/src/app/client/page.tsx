'use client';

import type {
  ClientSelfView,
  DailyLogView,
  NutritionPlanView,
  WorkoutProgramView,
} from '@wizzapp/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { ApiError, api } from '@/lib/api';
import { addDaysIso, decimal, initials, longDate, num, todayIso } from '@/lib/format';
import { computeStreak, logFor } from '@/lib/streak';
import { useApi } from '@/lib/useApi';
import { suggestedDay } from '@/lib/workoutDay';
import { palette } from '@/lib/palette';
import { ChangePasswordDialog } from '@/components/ui/ChangePasswordDialog';

export default function HomePage() {
  const today = todayIso();

  const me = useApi<ClientSelfView>((signal) => api.get<ClientSelfView>('/me', undefined, signal), []);

  const logs = useApi<DailyLogView[]>(
    (signal) =>
      api.get<DailyLogView[]>('/daily-logs/me', { from: addDaysIso(today, -13), to: today }, signal),
    [today],
  );

  const program = useApi<WorkoutProgramView | null>(
    (signal) =>
      api
        .get<WorkoutProgramView>('/programs/active', undefined, signal)
        .catch((error: unknown) => {
          // No program yet is an empty state, not a failure.
          if (error instanceof ApiError && error.isNotFound) return null;
          throw error;
        }),
    [],
  );

  const plan = useApi<NutritionPlanView | null>(
    (signal) =>
      api.get<NutritionPlanView>('/nutrition-plan/active', undefined, signal).catch(() => null),
    [],
  );

  const streak = useMemo(() => computeStreak(logs.data ?? [], today), [logs.data, today]);
  const day = useMemo(() => (program.data ? suggestedDay(program.data) : null), [program.data]);

  const yesterday = addDaysIso(today, -1);
  const yesterdayLog = logFor(logs.data ?? [], yesterday);

  // Latest weight and how it moved since the reading before it.
  const weighIns = (logs.data ?? [])
    .filter((log) => log.weightKg !== null)
    .sort((a, b) => b.logDate.localeCompare(a.logDate));
  const latestWeight = weighIns[0]?.weightKg ?? null;
  const [passwordOpen, setPasswordOpen] = useState(false);

  const weightDelta =
    weighIns.length >= 2 ? (weighIns[0].weightKg as number) - (weighIns[1].weightKg as number) : null;

  if (me.loading || logs.loading) return <Loading />;
  if (me.error) return <div className="p-5"><ErrorNote message={me.error.message} onRetry={me.reload} /></div>;

  return (
    <div className="flex flex-col gap-4 px-5 pt-[26px] pb-2">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-text-muted">{longDate(today)}</p>
          <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-[1.2] font-bold">
            {greeting()} {firstName(me.data?.name ?? '')}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setPasswordOpen(true)}
          title="تغيير كلمة المرور"
          aria-label="تغيير كلمة المرور"
          className="grid size-[46px] flex-none place-items-center rounded-full bg-lime text-[15px] font-bold text-surface transition-opacity hover:opacity-85"
        >
          {initials(me.data?.name ?? '')}
        </button>
      </header>

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />

      {/* The day's single most important action. */}
      {streak.loggedToday ? (
        <div className="flex items-center gap-3.5 rounded-[16px] bg-lime-tint p-5">
          <div className="grid size-[46px] flex-none place-items-center rounded-full bg-lime-tint-3">
            <CheckIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] text-[20px] font-bold text-lime-ink-strong">
              سجّلت اليوم، يعطيك العافية
            </p>
            <p className="text-[13.5px] text-lime-ink">
              <Num>{streak.length}</Num> أيام متتابعة بدون انقطاع
            </p>
          </div>
          <Link href="/client/log" className="p-1.5 text-[13.5px] font-bold text-lime-strong">
            تعديل
          </Link>
        </div>
      ) : (
        <Link
          href="/client/log"
          className="flex items-center gap-3.5 rounded-[16px] bg-accent p-5 text-accent-ink shadow-[0_2px_6px_rgba(44,24,16,.12)] transition-colors hover:bg-accent-hover"
        >
          <span className="grid size-[46px] flex-none place-items-center rounded-full bg-[rgba(14,15,18,.18)]">
            <PlusIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-[family-name:var(--font-display)] text-[21px] font-bold">
              لسا ما سجّلت اليوم
            </span>
            <span className="block text-[13.5px] opacity-90">دقيقة واحدة · 10 أرقام بس</span>
          </span>
          <span className="text-[20px]">←</span>
        </Link>
      )}

      {/* Today's session */}
      {day ? (
        <section className="flex flex-col gap-3.5 rounded-[16px] bg-surface p-5 border border-line-soft">
          <div className="flex items-center justify-between gap-2.5">
            <span className="rounded-full bg-accent-tint px-3 py-1.5 text-[12.5px] font-bold text-accent-pressed">
              تمرين اليوم
            </span>
            <span className="text-[13px] text-text-muted">
              <Num>{day.exercises.length}</Num> تمارين
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.2] font-bold">
            {day.dayLabel}
          </h2>
          <div className="flex flex-wrap gap-2">
            {day.exercises.slice(0, 3).map((exercise) => (
              <span
                key={exercise.id}
                className="rounded-full bg-bg px-3.5 py-2 text-[13px] font-semibold text-text-muted"
              >
                {exercise.name}
              </span>
            ))}
          </div>
          <Link
            href="/client/workout"
            className="grid h-[54px] place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] text-[19px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
          >
            ابدأ التمرين
          </Link>
        </section>
      ) : (
        <section className="rounded-[16px] bg-surface p-5">
          <p className="text-[14px] leading-relaxed text-text-muted">
            مدربك لسه ما جهّز برنامجك. بيوصلك هنا أول ما يخلص.
          </p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-surface p-4.5">
          <p className="text-[13px] font-semibold text-text-muted">آخر وزن</p>
          <p className="font-[family-name:var(--font-display)] text-[30px] font-bold">
            <Num>{latestWeight === null ? '—' : decimal(latestWeight)}</Num>
          </p>
          {weightDelta !== null && (
            <Num
              className={`text-[13px] font-bold ${weightDelta <= 0 ? 'text-lime-strong' : 'text-accent-pressed'}`}
            >
              {`${weightDelta > 0 ? '+' : ''}${decimal(weightDelta)} كجم`}
            </Num>
          )}
        </div>

        <div className="rounded-[16px] bg-lime-tint p-4.5">
          <p className="text-[13px] font-semibold text-lime-strong">سعرات الأمس</p>
          <p className="font-[family-name:var(--font-display)] text-[30px] font-bold text-lime-ink">
            <Num>{yesterdayLog?.caloriesActual === null || yesterdayLog === null ? '—' : num(yesterdayLog.caloriesActual)}</Num>
          </p>
          {yesterdayLog?.caloriesActual != null && plan.data && (
            <p className="text-[13px] font-bold text-lime-strong">
              {yesterdayLog.caloriesActual <= plan.data.dailyCalories ? 'تحت الهدف بـ ' : 'فوق الهدف بـ '}
              <Num>{num(Math.abs(yesterdayLog.caloriesActual - plan.data.dailyCalories))}</Num>
            </p>
          )}
        </div>
      </div>

      {/* Coach note — the trainer's goal note, shown in their voice. */}
      {me.data?.goalNote && (
        <div className="flex items-center gap-3 rounded-[16px] bg-surface-alt p-4.5">
          <div className="grid size-10 flex-none place-items-center rounded-full bg-surface text-[15px] font-bold text-lime-strong">
            {initials(me.data.trainerName)}
          </div>
          <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-text-2">
            «{me.data.goalNote}»
          </p>
        </div>
      )}
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'مساء الخير';
  return 'مساء الخير';
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={palette.successInk} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={palette.accentTintInk} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
