'use client';

import type { ClientProfile, WorkoutProgramView } from '@wizzapp/shared';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ErrorNote } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { PillField } from '@/components/ui/PillField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/components/ui/cn';
import { ApiError } from '@/lib/api';
import { todayIso } from '@/lib/format';
import {
  emptyDay,
  emptyExercise,
  hasChanges,
  isBlank,
  toDraft,
  type Draft,
  type DraftExercise,
} from './programDraft';
import { ExerciseVideoField } from './ExerciseVideoField';
import { TemplatePicker } from './TemplatePicker';
import { saveProgram } from './programSave';

const ROW =
  'h-11 min-w-0 rounded-full border border-border bg-input-bg text-text ' +
  'transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none';

export function ProgramBuilderScreen({
  client,
  onSaved,
}: {
  client: ClientProfile;
  onSaved: () => void;
}) {
  /** Server ids of the exercises as loaded, for looking up their videos. */
  const { notify } = useToast();
  const program = client.activeProgram;

  const [draft, setDraft] = useState<Draft>(() => seed(program));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  /** Row to focus once React has committed it — set when Enter adds a row. */
  const [focusKey, setFocusKey] = useState<string | null>(null);

  // Re-seed when the loaded program changes underneath us (after a save).
  const loadedId = useRef(program?.id ?? null);
  useEffect(() => {
    if (loadedId.current !== (program?.id ?? null)) {
      loadedId.current = program?.id ?? null;
      setDraft(seed(program));
    }
  }, [program]);

  const dirty = hasChanges(program, draft);

  /** The video the server currently holds for a saved exercise. */
  const videoFor = (exerciseId: string | null) =>
    exerciseId
      ? (program?.days
          .flatMap((d) => d.exercises)
          .find((e) => e.id === exerciseId)?.video ?? null)
      : null;

  // Warn before losing edits to a browser navigation.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const mutateDay = useCallback(
    (dayKey: string, change: (day: Draft['days'][number]) => Draft['days'][number]) => {
      setDraft((current) => ({
        ...current,
        days: current.days.map((day) => (day.key === dayKey ? change(day) : day)),
      }));
    },
    [],
  );

  function setExercise(dayKey: string, key: string, field: keyof DraftExercise, value: string) {
    mutateDay(dayKey, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.key === key ? { ...exercise, [field]: value } : exercise,
      ),
    }));
  }

  /** Returns the new row's key so callers can move focus to it. */
  function addExercise(dayKey: string): string {
    const created = emptyExercise();
    mutateDay(dayKey, (day) => ({ ...day, exercises: [...day.exercises, created] }));
    return created.key;
  }

  // Focus after commit. requestAnimationFrame can fire before React has painted
  // the new row, which left the caret nowhere.
  useEffect(() => {
    if (!focusKey) return;
    document.querySelector<HTMLInputElement>(`[data-row="${focusKey}"] [data-role="exercise-name"]`)?.focus();
    setFocusKey(null);
  }, [focusKey]);

  /** Enter moves to the next row, adding one when you're on the last. */
  function onRowKeyDown(event: KeyboardEvent<HTMLDivElement>, dayKey: string, index: number) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const day = draft.days.find((d) => d.key === dayKey);
    if (!day) return;

    if (index === day.exercises.length - 1) {
      setFocusKey(addExercise(dayKey));
      return;
    }

    setFocusKey(day.exercises[index + 1].key);
  }

  function moveDay(from: number, to: number) {
    if (to < 0 || to >= draft.days.length || from === to) return;
    setDraft((current) => {
      const days = [...current.days];
      const [moved] = days.splice(from, 1);
      days.splice(to, 0, moved);
      return { ...current, days };
    });
  }

  async function save() {
    if (!draft.title.trim()) {
      setError('عنوان البرنامج مطلوب');
      return;
    }
    if (!draft.startDate) {
      setError('تاريخ البداية مطلوب');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveProgram(client.id, program, draft);
      notify('تم حفظ البرنامج');
      onSaved();
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'تعذّر حفظ البرنامج';
      setError(message);
      notify(message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  // A client with no programme gets the choice first: reuse a saved template,
  // or start empty. The builder proper appears once one exists.
  if (!program) {
    return <TemplatePicker clientId={client.id} onCreated={onSaved} />;
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="rounded-full bg-accent-tint px-3 py-1.5 text-[12.5px] font-semibold text-accent-tint-ink">
              تغييرات غير محفوظة
            </span>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex h-[50px] items-center rounded-full bg-accent px-[26px] font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? 'جارٍ الحفظ…' : 'حفظ البرنامج'}
        </button>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 rounded-[16px] bg-surface p-[22px] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <PillField
          label="عنوان البرنامج"
          placeholder="تنشيف 8 أسابيع"
          value={draft.title}
          onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
        />
        <PillField
          label="تاريخ البداية"
          type="date"
          value={draft.startDate}
          onChange={(e) => setDraft((c) => ({ ...c, startDate: e.target.value }))}
        />
      </div>

      {draft.days.map((day, dayIndex) => {
        const filled = day.exercises.filter((exercise) => !isBlank(exercise)).length;

        return (
          <section
            key={day.key}
            data-day={day.key}
            onDragOver={(event) => {
              if (!dragging || dragging === day.key) return;
              event.preventDefault();
              moveDay(
                draft.days.findIndex((d) => d.key === dragging),
                dayIndex,
              );
            }}
            className={cn(
              'flex flex-col gap-3.5 rounded-[16px] bg-surface p-[22px] border border-line-soft',
              dragging === day.key && 'opacity-50',
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                draggable
                onDragStart={() => setDragging(day.key)}
                onDragEnd={() => setDragging(null)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveDay(dayIndex, dayIndex - 1);
                  }
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveDay(dayIndex, dayIndex + 1);
                  }
                }}
                aria-label={`ترتيب ${day.name} — استخدم الأسهم للتحريك`}
                className="cursor-grab px-1 text-[18px] tracking-[2px] text-placeholder active:cursor-grabbing"
              >
                ⋮⋮
              </button>

              <input
                value={day.name}
                onChange={(e) => mutateDay(day.key, (d) => ({ ...d, name: e.target.value }))}
                aria-label="اسم اليوم"
                placeholder={`يوم ${dayIndex + 1}`}
                className={cn(
                  ROW,
                  'h-[46px] min-w-[180px] flex-1 px-[18px]',
                  'font-[family-name:var(--font-display)] text-[19px] font-bold',
                )}
              />

              <span className="text-[13px] font-semibold text-text-muted">
                <Num>{filled}</Num> تمارين
              </span>

              <button
                onClick={() =>
                  setDraft((c) => ({ ...c, days: c.days.filter((d) => d.key !== day.key) }))
                }
                className="rounded-full border border-[rgba(255,138,91,.35)] px-4 py-[9px] text-[13.5px] font-semibold text-accent-pressed transition-colors hover:bg-accent-tint"
              >
                حذف اليوم
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {day.exercises.map((exercise, index) => (
                <div
                  key={exercise.key}
                  data-row={exercise.key}
                  onKeyDown={(event) => onRowKeyDown(event, day.key, index)}
                  className="flex flex-wrap items-center gap-2.5 rounded-[12px] bg-bg p-3"
                >
                  <input
                    data-role="exercise-name"
                    value={exercise.name}
                    onChange={(e) => setExercise(day.key, exercise.key, 'name', e.target.value)}
                    placeholder="اسم التمرين"
                    aria-label="اسم التمرين"
                    className={cn(ROW, 'px-4 text-[14.5px] font-semibold [flex:3_1_160px]')}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={exercise.sets}
                    onChange={(e) => setExercise(day.key, exercise.key, 'sets', e.target.value)}
                    placeholder="سِت"
                    aria-label="عدد المجموعات"
                    className={cn(ROW, 'tnum px-2.5 text-center text-[15px] [flex:1_1_64px]')}
                  />
                  <input
                    value={exercise.reps}
                    onChange={(e) => setExercise(day.key, exercise.key, 'reps', e.target.value)}
                    placeholder="تكرارات"
                    aria-label="التكرارات"
                    className={cn(ROW, 'px-2.5 text-center text-[15px] [flex:1_1_76px]')}
                  />
                  <input
                    value={exercise.rest}
                    onChange={(e) => setExercise(day.key, exercise.key, 'rest', e.target.value)}
                    placeholder="راحة"
                    aria-label="فترة الراحة"
                    className={cn(ROW, 'px-2.5 text-center text-[14px] [flex:1_1_72px]')}
                  />
                  <input
                    value={exercise.notes}
                    onChange={(e) => setExercise(day.key, exercise.key, 'notes', e.target.value)}
                    placeholder="ملاحظة للمتدرب"
                    aria-label="ملاحظة للمتدرب"
                    className={cn(ROW, 'px-4 text-[14px] [flex:3_1_150px]')}
                  />
                  <button
                    onClick={() =>
                      mutateDay(day.key, (d) => ({
                        ...d,
                        exercises: d.exercises.filter((x) => x.key !== exercise.key),
                      }))
                    }
                    title="حذف التمرين"
                    aria-label={`حذف ${exercise.name || 'التمرين'}`}
                    className="grid size-10 flex-none place-items-center rounded-full bg-surface-alt text-[18px] text-accent-pressed transition-colors hover:bg-accent-tint-2"
                  >
                    ×
                  </button>

                  {/* Video saves straight away rather than joining the draft —
                      a file can't survive in local state across a navigation. */}
                  <div className="w-full">
                    <ExerciseVideoField
                      exerciseId={exercise.id}
                      video={videoFor(exercise.id)}
                      onChanged={onSaved}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addExercise(day.key)}
              className="h-11 self-start rounded-full border border-dashed border-border-dashed px-5 text-[14.5px] font-semibold text-text-muted transition-colors hover:bg-accent-tint hover:text-accent-pressed"
            >
              + تمرين جديد (Enter ينقلك للسطر التالي)
            </button>
          </section>
        );
      })}

      <button
        onClick={() => setDraft((c) => ({ ...c, days: [...c.days, emptyDay(c.days.length)] }))}
        className="h-14 rounded-[16px] border border-dashed border-border-dashed font-[family-name:var(--font-display)] text-[18px] font-bold text-text-muted transition-colors hover:bg-accent-tint hover:text-accent-pressed"
      >
        + إضافة يوم تمرين
      </button>
    </div>
  );
}

/** A brand-new program starts with today's date and one empty day to fill. */
function seed(program: WorkoutProgramView | null): Draft {
  const draft = toDraft(program);
  if (program) return draft;
  return { title: '', startDate: todayIso(), days: [emptyDay(0)] };
}
