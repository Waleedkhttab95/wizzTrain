'use client';

import type { ExerciseItemView, WorkoutProgramView } from '@wizzapp/shared';
import { useEffect, useMemo, useState } from 'react';
import { WorkoutExercise } from '@/components/client/WorkoutExercise';
import { EmptyState, ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { api } from '@/lib/api';
import { todayIso } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { localDateOf, suggestedDay, writeLastDay } from '@/lib/workoutDay';

export default function WorkoutPage() {
  const program = useApi<WorkoutProgramView>(
    (signal) => api.get<WorkoutProgramView>('/programs/active', undefined, signal),
    [],
  );

  const [dayId, setDayId] = useState<string | null>(null);

  useEffect(() => {
    if (!program.data) return;
    const suggested = suggestedDay(program.data);
    setDayId((current) => current ?? suggested?.id ?? null);
  }, [program.data]);

  const day = useMemo(
    () => program.data?.days.find((d) => d.id === dayId) ?? program.data?.days[0] ?? null,
    [program.data, dayId],
  );

  function onLogged(updated: ExerciseItemView) {
    if (!program.data || !day) return;
    writeLastDay(program.data.id, day.id);
    program.set({
      ...program.data,
      days: program.data.days.map((d) =>
        d.id === day.id
          ? { ...d, exercises: d.exercises.map((e) => (e.id === updated.id ? updated : e)) }
          : d,
      ),
    });
  }

  if (program.loading) return <Loading />;

  if (program.error?.isNotFound) {
    return (
      <div className="p-5">
        <EmptyState
          title="ما فيه برنامج بعد"
          body="مدربك لسه ما جهّز برنامجك التدريبي. بيوصلك هنا أول ما يخلص."
        />
      </div>
    );
  }

  if (program.error || !program.data || !day) {
    return (
      <div className="p-5">
        <ErrorNote
          message={program.error?.message ?? 'تعذّر تحميل البرنامج'}
          onRetry={program.reload}
        />
      </div>
    );
  }

  const today = todayIso();
  const done = day.exercises.filter((exercise) =>
    exercise.logs.some((log) => localDateOf(log.completedAt) === today),
  ).length;
  const pct = day.exercises.length === 0 ? 0 : (done / day.exercises.length) * 100;

  return (
    <div className="flex flex-col gap-3.5 px-5 pt-[26px] pb-2 lg:mx-auto lg:w-full lg:max-w-[980px] lg:px-6 lg:pt-9">
      <header>
        <p className="text-[13.5px] font-semibold text-text-muted">تمرين اليوم</p>
        <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-[1.2] font-bold">
          {day.dayLabel}
        </h1>
      </header>

      {/* Day picker — the app suggests, the client chooses. */}
      {program.data.days.length > 1 && (
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="flex min-w-max gap-2">
            {program.data.days.map((option) => {
              const selected = option.id === day.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setDayId(option.id)}
                  aria-pressed={selected}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors',
                    selected
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface text-text-muted hover:text-text',
                  )}
                >
                  {option.dayLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-[14px] bg-surface p-4">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-text-muted">تقدّمك بالتمرين</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Num className="font-[family-name:var(--font-display)] text-[22px] font-bold">
          {`${done}/${day.exercises.length}`}
        </Num>
      </div>

      {day.exercises.length === 0 ? (
        <EmptyState title="ما فيه تمارين بهذا اليوم" body="اختر يومًا آخر أو كلّم مدربك." />
      ) : (
        // One per row on a phone; two abreast once there is width for them.
        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
          {day.exercises.map((exercise, index) => (
            <WorkoutExercise
              key={exercise.id}
              index={index + 1}
              exercise={exercise}
              onLogged={onLogged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
