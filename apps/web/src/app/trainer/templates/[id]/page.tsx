'use client';

import type { ProgramTemplateView } from '@wizzapp/shared';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { PillField, PillTextArea } from '@/components/ui/PillField';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import {
  emptyDay,
  emptyExercise,
  exerciseCount,
  toDraft,
  toPayload,
  type DraftDay,
  type DraftExercise,
  type TemplateDraft,
} from '@/lib/templateDraft';

const ROW =
  'h-11 min-w-0 rounded-full border border-border bg-input-bg text-text ' +
  'transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none';

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const isNew = id === 'new';

  const [draft, setDraft] = useState<TemplateDraft>(() => toDraft(null));
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;

    const controller = new AbortController();
    api
      .get<ProgramTemplateView>(`/templates/${id}`, undefined, controller.signal)
      .then((template) => {
        if (!controller.signal.aborted) setDraft(toDraft(template));
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof ApiError ? caught.message : 'تعذّر تحميل الجدول');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, isNew]);

  // Focus after commit, so a row added with Enter actually receives the caret.
  useEffect(() => {
    if (!focusKey) return;
    document
      .querySelector<HTMLInputElement>(`[data-row="${focusKey}"] [data-role="name"]`)
      ?.focus();
    setFocusKey(null);
  }, [focusKey]);

  function mutateDay(dayKey: string, change: (day: DraftDay) => DraftDay) {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) => (day.key === dayKey ? change(day) : day)),
    }));
  }

  function setExercise(dayKey: string, key: string, field: keyof DraftExercise, value: string) {
    mutateDay(dayKey, (day) => ({
      ...day,
      exercises: day.exercises.map((e) => (e.key === key ? { ...e, [field]: value } : e)),
    }));
  }

  function addExercise(dayKey: string): string {
    const created = emptyExercise();
    mutateDay(dayKey, (day) => ({ ...day, exercises: [...day.exercises, created] }));
    return created.key;
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLDivElement>, dayKey: string, index: number) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const day = draft.days.find((d) => d.key === dayKey);
    if (!day) return;

    setFocusKey(
      index === day.exercises.length - 1 ? addExercise(dayKey) : day.exercises[index + 1].key,
    );
  }

  async function save() {
    if (!draft.title.trim()) {
      setError('عنوان الجدول مطلوب');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body = toPayload(draft);
      const saved = isNew
        ? await api.post<ProgramTemplateView>('/templates', body)
        : await api.put<ProgramTemplateView>(`/templates/${id}`, body);

      notify(isNew ? 'تم إنشاء الجدول' : 'تم حفظ الجدول');
      router.push(`/trainer/templates/${saved.id}`);
      setDraft(toDraft(saved));
    } catch (caught) {
      const message =
        caught instanceof ApiError ? (caught.fieldMessages[0] ?? caught.message) : 'تعذّر الحفظ';
      setError(message);
      notify(message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="flex max-w-[980px] flex-col gap-[22px]">
      <div>
        <Link
          href="/trainer/templates"
          className="inline-block pb-2 text-[14px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
        >
          ← رجوع للجداول
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-[36px] font-bold">
            {isNew ? 'جدول جديد' : draft.title || 'تعديل الجدول'}
          </h1>
          <button
            onClick={save}
            disabled={saving}
            className="flex h-[50px] items-center rounded-full bg-accent px-[26px] font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-45"
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ الجدول'}
          </button>
        </div>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          <Num>{draft.days.length}</Num> أيام · <Num>{exerciseCount(draft)}</Num> تمرين
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 rounded-[16px] bg-surface p-[22px] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <PillField
          label="عنوان الجدول"
          placeholder="تقسيم دفع/سحب/أرجل"
          value={draft.title}
          onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
        />
        <PillTextArea
          label="ملاحظات (اختياري)"
          rows={2}
          placeholder="لمن يناسب هذا الجدول؟"
          value={draft.notes}
          onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))}
        />
      </div>

      {draft.days.map((day, dayIndex) => (
        <section
          key={day.key}
          className="flex flex-col gap-3.5 rounded-[16px] bg-surface p-[22px] border border-line-soft"
        >
          <div className="flex flex-wrap items-center gap-3">
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
              <Num>{day.exercises.filter((e) => e.name.trim()).length}</Num> تمارين
            </span>
            <button
              onClick={() => setDraft((c) => ({ ...c, days: c.days.filter((d) => d.key !== day.key) }))}
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
                  data-role="name"
                  value={exercise.name}
                  onChange={(e) => setExercise(day.key, exercise.key, 'name', e.target.value)}
                  placeholder="اسم التمرين"
                  aria-label="اسم التمرين"
                  className={cn(ROW, 'px-4 text-[14.5px] font-semibold [flex:3_1_150px]')}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={exercise.sets}
                  onChange={(e) => setExercise(day.key, exercise.key, 'sets', e.target.value)}
                  placeholder="سِت"
                  aria-label="عدد المجموعات"
                  className={cn(ROW, 'tnum px-2.5 text-center text-[15px] [flex:1_1_62px]')}
                />
                <input
                  value={exercise.reps}
                  onChange={(e) => setExercise(day.key, exercise.key, 'reps', e.target.value)}
                  placeholder="تكرارات"
                  aria-label="التكرارات"
                  className={cn(ROW, 'px-2.5 text-center text-[15px] [flex:1_1_72px]')}
                />
                <input
                  value={exercise.rest}
                  onChange={(e) => setExercise(day.key, exercise.key, 'rest', e.target.value)}
                  placeholder="راحة"
                  aria-label="فترة الراحة"
                  className={cn(ROW, 'px-2.5 text-center text-[14px] [flex:1_1_68px]')}
                />
                <input
                  dir="ltr"
                  value={exercise.videoUrl}
                  onChange={(e) => setExercise(day.key, exercise.key, 'videoUrl', e.target.value)}
                  placeholder="رابط فيديو (اختياري)"
                  aria-label="رابط فيديو الشرح"
                  className={cn(ROW, 'px-4 text-start text-[13.5px] [flex:3_1_170px]')}
                />
                <input
                  value={exercise.notes}
                  onChange={(e) => setExercise(day.key, exercise.key, 'notes', e.target.value)}
                  placeholder="ملاحظة"
                  aria-label="ملاحظة للمتدرب"
                  className={cn(ROW, 'px-4 text-[14px] [flex:2_1_120px]')}
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
              </div>
            ))}
          </div>

          <button
            onClick={() => setFocusKey(addExercise(day.key))}
            className="h-11 self-start rounded-full border border-dashed border-border-dashed px-5 text-[14.5px] font-semibold text-text-muted transition-colors hover:bg-accent-tint hover:text-accent-pressed"
          >
            + تمرين جديد (Enter ينقلك للسطر التالي)
          </button>
        </section>
      ))}

      <button
        onClick={() => setDraft((c) => ({ ...c, days: [...c.days, emptyDay(c.days.length)] }))}
        className="h-14 rounded-[16px] border border-dashed border-border-dashed font-[family-name:var(--font-display)] text-[18px] font-bold text-text-muted transition-colors hover:bg-accent-tint hover:text-accent-pressed"
      >
        + إضافة يوم تمرين
      </button>

      {!isNew && (
        <p className="text-[12.5px] leading-relaxed text-text-faint">
          الفيديوهات المرفوعة على تمارين هذا الجدول محفوظة كما هي — حقل الرابط هنا للروابط فقط.
        </p>
      )}
    </div>
  );
}
