'use client';

import type { ProgramTemplateSummary } from '@wizzapp/shared';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { PillField } from '@/components/ui/PillField';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { todayIso } from '@/lib/format';
import { useApi } from '@/lib/useApi';

/**
 * The first thing a trainer sees when a client has no programme: start from a
 * saved template, or from an empty one.
 *
 * Applying a template copies it, so the programme is immediately the client's
 * own and can be edited without touching the template it came from.
 */
export function TemplatePicker({
  clientId,
  onCreated,
}: {
  clientId: string;
  onCreated: () => void;
}) {
  const { notify } = useToast();

  const templates = useApi<ProgramTemplateSummary[]>(
    (signal) => api.get<ProgramTemplateSummary[]>('/templates', undefined, signal),
    [],
  );

  const [mode, setMode] = useState<'template' | 'blank'>('template');
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = templates.data ?? [];

  async function create(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError('عنوان البرنامج مطلوب');
      return;
    }
    if (mode === 'template' && !selected) {
      setError('اختر جدولًا أو ابدأ من الصفر');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post(`/clients/${clientId}/programs`, {
        title: title.trim(),
        startDate,
        ...(mode === 'template' && selected ? { templateId: selected } : {}),
      });
      notify('تم إنشاء البرنامج');
      onCreated();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? (caught.fieldMessages[0] ?? caught.message)
          : 'تعذّر إنشاء البرنامج';
      setError(message);
      notify(message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={create} className="flex flex-col gap-5">
      <div role="group" aria-label="طريقة البدء" className="flex gap-1 self-start rounded-full bg-surface-alt p-1">
        {(
          [
            { value: 'template', label: 'من جدول جاهز' },
            { value: 'blank', label: 'من الصفر' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            className={cn(
              'rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors',
              mode === option.value ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <ErrorNote message={error} />}

      {mode === 'template' &&
        (templates.loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-[16px] border border-dashed border-border-dashed p-7">
            <p className="text-[15px] leading-relaxed text-text-muted">
              ما عندك جداول محفوظة بعد. ابنِ واحدًا مرة وتقدر تطبّقه على كل متدربينك.
            </p>
            <Link
              href="/trainer/templates/new"
              className="rounded-full bg-lime-strong px-5 py-2.5 text-[14px] font-bold text-lime-tint transition-colors hover:bg-lime-ink"
            >
              إنشاء جدول
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {list.map((template) => {
              const on = selected === template.id;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(template.id);
                      // Prefill the programme title from the template, which is
                      // almost always what the trainer wants to call it.
                      if (!title.trim()) setTitle(template.title);
                    }}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-[14px] border p-4 text-start transition-colors',
                      on
                        ? 'border-accent bg-accent-tint'
                        : 'border-line-soft bg-surface hover:border-border',
                    )}
                  >
                    <span
                      className={cn(
                        'font-[family-name:var(--font-display)] text-[18px] font-bold',
                        on && 'text-accent-tint-ink',
                      )}
                    >
                      {template.title}
                    </span>
                    <span className="text-[13px] text-text-muted">
                      <Num>{template.dayCount}</Num> أيام · <Num>{template.exerciseCount}</Num> تمرين
                    </span>
                    {template.notes && (
                      <span className="line-clamp-2 text-[12.5px] text-text-faint">
                        {template.notes}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      <div className="grid gap-4 rounded-[16px] bg-surface p-[22px] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <PillField
          label="عنوان البرنامج"
          placeholder="برنامج التضخيم — المرحلة الأولى"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <PillField
          label="تاريخ البداية"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex h-[50px] w-fit items-center rounded-full bg-accent px-[26px] font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-45"
      >
        {saving ? 'جارٍ الإنشاء…' : mode === 'template' ? 'إنشاء من الجدول' : 'إنشاء برنامج فارغ'}
      </button>

      <p className="text-[12.5px] leading-relaxed text-text-faint">
        الجدول بيتنسخ نسخة مستقلة — تعديل برنامج المتدرب بعدين ما يغيّر الجدول الأصلي.
      </p>
    </form>
  );
}
