'use client';

import type { ProgramTemplateSummary } from '@wizzapp/shared';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState, ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { longDate } from '@/lib/format';
import { useApi } from '@/lib/useApi';

export default function TemplatesPage() {
  const { notify } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const templates = useApi<ProgramTemplateSummary[]>(
    (signal) => api.get<ProgramTemplateSummary[]>('/templates', undefined, signal),
    [],
  );

  async function remove(template: ProgramTemplateSummary) {
    if (!confirm(`حذف جدول «${template.title}»؟ البرامج المبنية منه ما تتأثر.`)) return;

    setBusy(template.id);
    try {
      await api.del(`/templates/${template.id}`);
      notify('تم حذف الجدول');
      templates.reload();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر الحذف', 'bad');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold text-text-muted">قوالب جاهزة تعيد استخدامها</p>
          <h1 className="font-[family-name:var(--font-display)] text-[38px] leading-[1.15] font-bold">
            جداول التمارين
          </h1>
        </div>
        <Link
          href="/trainer/templates/new"
          className="flex h-[50px] items-center rounded-full bg-accent px-6 font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink shadow-[0_2px_6px_rgba(44,24,16,.12)] transition-colors hover:bg-accent-hover"
        >
          + جدول جديد
        </Link>
      </header>

      <p className="max-w-[70ch] text-[14px] leading-relaxed text-text-muted">
        الجدول قالب تحفظه مرة وتستخدمه مع أي متدرب. وقت ما تطبّقه على متدرب بيتنسخ نسخة مستقلة —
        فتعديل برنامج المتدرب ما يغيّر الجدول، وتعديل الجدول ما يغيّر برامج شغّالة.
      </p>

      {templates.loading ? (
        <Loading />
      ) : templates.error ? (
        <ErrorNote message={templates.error.message} onRetry={templates.reload} />
      ) : (templates.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="ما فيه جداول محفوظة"
          body="ابنِ جدولك الأول — مثلاً «تقسيم دفع/سحب/أرجل» — وبعدين طبّقه على أي متدرب بضغطة."
          action={
            <Link
              href="/trainer/templates/new"
              className="flex h-[46px] items-center rounded-full bg-accent px-5 font-[family-name:var(--font-display)] text-[16px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              إنشاء أول جدول
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {templates.data!.map((template) => (
            <li
              key={template.id}
              className="flex flex-col gap-3 rounded-[16px] bg-surface p-5 border border-line-soft transition-shadow hover:shadow-[0_6px_18px_rgba(44,24,16,.10)]"
            >
              <div className="min-w-0">
                <h2 className="truncate font-[family-name:var(--font-display)] text-[20px] leading-tight font-bold">
                  {template.title}
                </h2>
                <p className="mt-1 text-[13px] text-text-muted">
                  <Num>{template.dayCount}</Num> أيام · <Num>{template.exerciseCount}</Num> تمرين
                </p>
              </div>

              {template.notes && (
                <p className="line-clamp-2 text-[13px] leading-relaxed text-text-faint">
                  {template.notes}
                </p>
              )}

              <p className="text-[12px] text-text-faint">
                آخر تعديل {longDate(template.updatedAt.slice(0, 10))}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/trainer/templates/${template.id}`}
                  className="flex h-10 items-center rounded-full bg-accent px-4 text-[13.5px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
                >
                  تعديل
                </Link>
                <button
                  onClick={() => remove(template)}
                  disabled={busy === template.id}
                  className="h-10 rounded-full border border-[rgba(255,138,91,.35)] px-4 text-[13.5px] font-semibold text-accent-pressed transition-colors hover:bg-accent-tint disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
