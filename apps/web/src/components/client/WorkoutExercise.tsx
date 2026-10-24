'use client';

import type { ExerciseItemView, ExerciseLogView } from '@wizzapp/shared';
import { useState } from 'react';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { todayIso } from '@/lib/format';
import { localDateOf } from '@/lib/workoutDay';

const INPUT =
  'h-[52px] min-w-0 rounded-full border border-border bg-input-bg px-4 text-[19px] font-bold ' +
  'text-center transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none';

/**
 * One exercise as the client works through it. Logging is two fields and a
 * button on the card itself — they're standing at a rack with one hand free.
 */
export function WorkoutExercise({
  index,
  exercise,
  onLogged,
}: {
  index: number;
  exercise: ExerciseItemView;
  onLogged: (updated: ExerciseItemView) => void;
}) {
  const { notify } = useToast();
  const today = todayIso();
  const todayLogs = exercise.logs.filter((log) => localDateOf(log.completedAt) === today);
  const done = todayLogs.length > 0;

  const [weight, setWeight] = useState(() => String(todayLogs[0]?.actualWeightKg ?? ''));
  const [actual, setActual] = useState(() => todayLogs[0]?.actualReps ?? '');
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      if (done) {
        // "تعديل" clears today's entries so the client can re-record them.
        for (const log of todayLogs) {
          await api.del(`/exercises/logs/${log.id}`);
        }
        onLogged({
          ...exercise,
          logs: exercise.logs.filter((log) => !todayLogs.some((t) => t.id === log.id)),
        });
      } else {
        const created = await api.post<ExerciseLogView>(`/exercises/${exercise.id}/logs`, {
          actualWeightKg: weight.trim() === '' ? undefined : Number(weight),
          actualReps: actual.trim() === '' ? undefined : actual.trim(),
        });
        onLogged({ ...exercise, logs: [created, ...exercise.logs] });
        notify('تم تسجيل التمرين');
      }
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر الحفظ', 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-[16px] p-4.5 border border-line-soft',
        done ? 'bg-lime-tint' : 'bg-surface',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-9 flex-none place-items-center rounded-full text-[15px] font-bold',
            done ? 'bg-lime-deep text-lime-ink-strong' : 'bg-accent-tint text-accent-pressed',
          )}
        >
          <Num>{index}</Num>
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-[21px] leading-[1.25] font-bold">
            {exercise.name}
          </h2>
          <Num className="text-[14px] font-semibold text-text-muted">
            {`${exercise.sets} × ${exercise.reps}${exercise.restInterval ? ` · راحة ${exercise.restInterval}` : ''}`}
          </Num>
        </div>

        <span
          className={cn(
            'grid size-[26px] flex-none place-items-center rounded-full text-[14px] font-bold',
            done ? 'bg-lime-strong text-lime-tint' : 'bg-surface-alt text-text-faint',
          )}
          aria-hidden="true"
        >
          {done ? '✓' : '−'}
        </span>
      </div>

      {/* An uploaded clip plays inline; a link opens where it lives, because a
          YouTube or Instagram URL can't be dropped into a <video> element. */}
      {exercise.video &&
        (exercise.video.kind === 'upload' ? (
          <video
            src={exercise.video.url}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-[12px] bg-black"
            aria-label={`فيديو شرح ${exercise.name}`}
          />
        ) : (
          <a
            href={exercise.video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[12px] bg-accent-tint px-4 py-3 text-[14px] font-bold text-accent-tint-ink transition-colors hover:bg-accent-tint-2"
          >
            <PlayIcon />
            شاهد شرح التمرين
          </a>
        ))}

      {exercise.notes && (
        <p className="rounded-[12px] bg-accent-tint px-3.5 py-3 text-[13.5px] leading-relaxed text-accent-tint-ink">
          {exercise.notes}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <label className="flex min-w-0 flex-col gap-1.5 text-[12.5px] font-semibold text-text-muted [flex:1_1_130px]">
          الوزن المستخدم (كجم)
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="60"
            disabled={done}
            className={cn(INPUT, 'tnum disabled:opacity-60')}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-[12.5px] font-semibold text-text-muted [flex:1_1_130px]">
          التكرارات الفعلية
          <input
            dir="ltr"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="10/9/9"
            disabled={done}
            className={cn(INPUT, 'disabled:opacity-60')}
          />
        </label>
      </div>

      <button
        onClick={toggle}
        disabled={saving}
        className={cn(
          'h-[50px] rounded-full font-[family-name:var(--font-display)] text-[17px] font-bold',
          'transition-colors disabled:opacity-60',
          done
            ? 'bg-lime-tint-2 text-lime-ink'
            : 'bg-accent text-accent-ink hover:bg-accent-hover',
        )}
      >
        {saving ? '…' : done ? 'تم التسجيل — تعديل' : 'سجّل التمرين'}
      </button>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12l-6 3.5z" />
    </svg>
  );
}
