'use client';

import type { AdherenceStatus, ClientSummary } from '@wizzapp/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClientCard, StatTile } from '@/components/trainer/ClientCard';
import { STATUS } from '@/components/trainer/clientStatus';
import { cn } from '@/components/ui/cn';
import { EmptyState, ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num, formatNumber } from '@/components/ui/Num';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';

/**
 * The segmented filter above the roster. The first three narrow the active
 * roster in the browser; 'archived' is different — it asks the API for a
 * different list, because archived clients are deliberately absent from the
 * one the dashboard counts.
 */
type Filter = AdherenceStatus | 'archived' | null;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'الكل', value: null },
  { label: 'ملتزم', value: 'committed' },
  { label: 'متأخر', value: 'behind' },
  { label: 'المؤرشفون', value: 'archived' },
];

// Latin numerals, per the handoff — `ar-EG` alone renders ٩ سبتمبر.
const TODAY_LABEL = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function ClientsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(null);
  const showingArchived = filter === 'archived';

  const clients = useApi<ClientSummary[]>(
    (signal) =>
      api.get<ClientSummary[]>(
        '/clients',
        showingArchived ? { archived: 'true' } : undefined,
        signal,
      ),
    [showingArchived],
  );

  const all = useMemo(() => clients.data ?? [], [clients.data]);

  // The API returns the whole roster and has no search — a single trainer's
  // list is small enough to filter here, live as they type.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return all.filter((client) => {
      const matchesQuery = !term || client.name.toLowerCase().includes(term);
      // The archived list arrives pre-filtered, so only the status filters
      // have anything left to narrow.
      const matchesFilter =
        filter === null || filter === 'archived' || client.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [all, query, filter]);

  const stats = useMemo(() => {
    const loggedToday = all.filter(
      (client) => client.weekStrip[client.weekStrip.length - 1],
    ).length;
    const behind = all.filter((client) => client.status === 'behind').length;
    const adherence =
      all.length === 0
        ? 0
        : Math.round(
            (all.reduce((sum, client) => sum + client.daysLoggedThisWeek, 0) /
              (all.length * 7)) *
              100,
          );
    return { total: all.length, loggedToday, behind, adherence };
  }, [all]);

  return (
    <div className="flex max-w-[1120px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold text-text-muted">
            {TODAY_LABEL.format(new Date())}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[38px] leading-[1.15] font-bold">
            متدربينك
          </h1>
        </div>
        <Link
          href="/trainer/add"
          className="flex h-[50px] items-center rounded-full bg-accent px-6 font-[family-name:var(--font-display)] text-[17px] font-bold text-accent-ink shadow-[0_2px_8px_rgba(0,0,20,.45)] transition-colors duration-150 hover:bg-accent-hover"
        >
          + إضافة متدرب جديد
        </Link>
      </header>

      {clients.loading ? (
        <Loading />
      ) : clients.error ? (
        <ErrorNote message={clients.error.message} onRetry={clients.reload} />
      ) : (
        <>
          {showingArchived ? (
            <p className="rounded-[14px] border border-line bg-surface-alt px-5 py-4 text-[14px] leading-relaxed text-text-muted">
              هؤلاء متدربون أوقفت العمل معهم. سجلّهم وبرامجهم محفوظة بالكامل، وهم خارج
              الإحصاءات ولا يستطيعون الدخول للتطبيق. افتح ملف أي منهم لإرجاعه.
            </p>
          ) : (
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              <StatTile label="متدربين نشطين" value={formatNumber(stats.total)} />
              <StatTile label="سجّلوا اليوم" value={formatNumber(stats.loggedToday)} tone="lime" />
              <StatTile
                label="متأخرين بالتسجيل"
                value={formatNumber(stats.behind)}
                tone="accent"
              />
              <StatTile label="متوسط الالتزام" value={`${stats.adherence}%`} />
            </div>
          )}

          {all.length === 0 && showingArchived ? (
            <EmptyState
              title="لا يوجد متدربون مؤرشفون"
              body="كل متدربيك نشطون. الأرشفة تُستخدم لمن توقّف عن التدريب دون حذف سجلّه."
              action={
                <button
                  type="button"
                  onClick={() => setFilter(null)}
                  className="flex h-[46px] items-center rounded-full bg-accent px-5 font-[family-name:var(--font-display)] text-[16px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
                >
                  رجوع للمتدربين
                </button>
              }
            />
          ) : all.length === 0 ? (
            <EmptyState
              title="لا يوجد متدربون بعد"
              body="أضف أول متدرب لتبدأ في بناء برنامجه التدريبي وخطته الغذائية."
              action={
                <Link
                  href="/trainer/add"
                  className="flex h-[46px] items-center rounded-full bg-accent px-5 font-[family-name:var(--font-display)] text-[16px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
                >
                  إضافة أول متدرب
                </Link>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث باسم المتدرب…"
                  aria-label="ابحث باسم المتدرب"
                  className="h-[46px] min-w-[220px] flex-1 rounded-full border border-border bg-input-bg px-5 text-[15px] transition-colors focus:border-accent focus:outline-none"
                />

                <div
                  role="group"
                  aria-label="تصفية حسب الالتزام"
                  className="flex gap-1 rounded-full bg-surface-alt p-1"
                >
                  {FILTERS.map((option) => {
                    const on = filter === option.value;
                    return (
                      <button
                        key={option.label}
                        onClick={() => setFilter(option.value)}
                        aria-pressed={on}
                        className={cn(
                          'rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150',
                          on ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {visible.length === 0 ? (
                <p className="py-12 text-center text-[14px] text-text-muted">
                  لا نتائج مطابقة
                  {query.trim() && <> لـ &laquo;{query.trim()}&raquo;</>}.
                </p>
              ) : (
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                  {visible.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              )}

              {/* Legend — colour alone shouldn't have to carry the status. */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-text-faint">
                {(Object.keys(STATUS) as AdherenceStatus[]).map((key) => (
                  <span key={key} className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: STATUS[key].dot }}
                    />
                    {STATUS[key].label}
                  </span>
                ))}
                <span className="ms-auto">
                  <Num>{`${visible.length} / ${all.length}`}</Num> متدرب
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
