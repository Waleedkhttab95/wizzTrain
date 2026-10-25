'use client';

import type { ClientProfile, DailyLogView, WeeklySummaryView } from '@wizzapp/shared';
import { useState } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { api } from '@/lib/api';
import { decimal, isoWeekOf, longDate, num, shiftIsoWeek, todayIso } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { TREND_WEEKS, buildTrend, trendGeometry, trendWeeks } from './weeklyTrend';
import { palette } from '@/lib/palette';

/** How far back the trainer can page. Beyond this there is nothing to show. */
const MAX_WEEKS_BACK = 52;

export function WeeklySummaryScreen({ client }: { client: ClientProfile }) {
  const currentWeek = isoWeekOf(todayIso());
  const [week, setWeek] = useState(currentWeek);

  const summary = useApi<WeeklySummaryView>(
    (signal) =>
      api.get<WeeklySummaryView>(`/clients/${client.id}/weekly-summary`, { week }, signal),
    [client.id, week],
  );

  // The chart spans eight weeks, which the summary endpoint does not cover —
  // one range read of the raw logs, averaged per week on the client.
  const trendRange = trendWeeks(week);
  const trendLogs = useApi<DailyLogView[]>(
    (signal) =>
      api.get<DailyLogView[]>(
        `/clients/${client.id}/daily-logs`,
        { from: weekStartOf(trendRange[0]), to: weekEndOf(week) },
        signal,
      ),
    [client.id, week],
  );

  const atOldest = week <= shiftIsoWeek(currentWeek, -MAX_WEEKS_BACK);
  const atNewest = week >= currentWeek;

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Week switcher. In RTL the arrow glyphs are reversed: → steps back. */}
      <div className="flex items-center gap-3 self-start rounded-full bg-surface-alt px-3 py-2">
        <ArrowButton
          onClick={() => setWeek((w) => shiftIsoWeek(w, -1))}
          disabled={atOldest}
          label="الأسبوع السابق"
        >
          &#8594;
        </ArrowButton>

        <div className="min-w-[210px] text-center">
          <p className="font-[family-name:var(--font-display)] text-[19px] font-bold">
            {summary.data ? weekTitle(summary.data.week) : '—'}
          </p>
          <p className="text-[12.5px] text-text-muted">
            {summary.data ? (
              <>
                {longDate(summary.data.weekStart)} — {longDate(summary.data.weekEnd)}
              </>
            ) : (
              ' '
            )}
          </p>
        </div>

        <ArrowButton
          onClick={() => setWeek((w) => shiftIsoWeek(w, 1))}
          disabled={atNewest}
          label="الأسبوع التالي"
        >
          &#8592;
        </ArrowButton>
      </div>

      {summary.loading && !summary.data ? (
        <Loading />
      ) : summary.error || !summary.data ? (
        <ErrorNote
          message={summary.error?.message ?? 'تعذّر تحميل الملخص'}
          onRetry={summary.reload}
        />
      ) : (
        <>
          <SummaryCards summary={summary.data} plan={client.activeNutritionPlan} />

          <section className="flex flex-col gap-4 rounded-[16px] bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold">
                تطور الوزن
              </h2>
              <p className="text-[13px] text-text-muted">
                كجم · آخر <Num>{TREND_WEEKS}</Num> أسابيع
              </p>
            </div>
            {trendLogs.loading && !trendLogs.data ? (
              <div className="grid h-[200px] place-items-center text-[13px] text-text-faint">
                جارٍ التحميل…
              </div>
            ) : (
              <WeightChart logs={trendLogs.data ?? []} endWeek={week} />
            )}
          </section>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            <MacroBars summary={summary.data} plan={client.activeNutritionPlan} />
            <AdherenceCard summary={summary.data} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Summary cards ────────────────────────────────────────────────────────

function SummaryCards({
  summary,
  plan,
}: {
  summary: WeeklySummaryView;
  plan: ClientProfile['activeNutritionPlan'];
}) {
  const kcalAverage = summary.nutrition.calories.dailyAverage;
  const kcalGap = kcalAverage !== null && plan ? kcalAverage - plan.dailyCalories : null;

  const sleepGap =
    summary.averageSleepHours !== null && summary.previousWeek.averageSleepHours !== null
      ? summary.averageSleepHours - summary.previousWeek.averageSleepHours
      : null;

  const adherenceGap =
    summary.adherence.rate !== null && summary.previousWeek.adherenceRate !== null
      ? (summary.adherence.rate - summary.previousWeek.adherenceRate) * 100
      : null;

  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
      <Card
        label="متوسط الوزن"
        value={summary.averageWeightKg === null ? '—' : decimal(summary.averageWeightKg)}
        unit="كجم"
        deltaValue={
          summary.weightChangeKg === null
            ? null
            : `${arrow(summary.weightChangeKg)} ${decimal(Math.abs(summary.weightChangeKg))}`
        }
        deltaText="كجم خلال الأسبوع"
        // Losing weight is the usual goal, so a fall reads as progress.
        good={summary.weightChangeKg === null ? null : summary.weightChangeKg < 0}
      />

      <Card
        label="متوسط السعرات"
        value={kcalAverage === null ? '—' : num(Math.round(kcalAverage))}
        deltaValue={
          kcalGap === null ? null : `${arrow(kcalGap)} ${num(Math.abs(Math.round(kcalGap)))}`
        }
        deltaText={
          kcalGap === null ? 'لا يوجد هدف محدد' : kcalGap < 0 ? 'تحت الهدف' : 'فوق الهدف'
        }
        good={kcalGap === null ? null : kcalGap <= 0}
      />

      <Card
        label="متوسط النوم"
        value={summary.averageSleepHours === null ? '—' : decimal(summary.averageSleepHours)}
        unit="س"
        deltaValue={sleepGap === null ? null : `${arrow(sleepGap)} ${decimal(Math.abs(sleepGap))}`}
        deltaText="س عن الأسبوع السابق"
        good={sleepGap === null ? null : sleepGap >= 0}
        tone={sleepGap !== null && sleepGap < 0 ? 'accent' : 'plain'}
      />

      <Card
        label="الالتزام بالتمارين"
        value={
          summary.adherence.rate === null ? '—' : `${Math.round(summary.adherence.rate * 100)}%`
        }
        deltaValue={
          adherenceGap === null ? null : `${arrow(adherenceGap)} ${Math.abs(Math.round(adherenceGap))}%`
        }
        deltaText="عن الأسبوع السابق"
        good={adherenceGap === null ? null : adherenceGap >= 0}
        tone="lime"
      />
    </div>
  );
}

/**
 * Only the numeric run goes through `<Num>`. Wrapping the whole sentence would
 * force `dir="ltr"` onto Arabic prose and reverse its word order — the same
 * bidi trap the handoff flags, in the opposite direction.
 */
function Card({
  label,
  value,
  unit,
  deltaValue,
  deltaText,
  good,
  tone = 'plain',
}: {
  label: string;
  value: string;
  unit?: string;
  /** The digits (with an arrow), or null when there is nothing to compare. */
  deltaValue: string | null;
  /** The Arabic tail, left in the document's own right-to-left flow. */
  deltaText: string;
  good: boolean | null;
  tone?: 'plain' | 'lime' | 'accent';
}) {
  const bg = { plain: 'bg-surface', lime: 'bg-lime-tint', accent: 'bg-accent-tint' }[tone];

  return (
    <div className={cn('flex flex-col gap-1.5 rounded-[16px] p-5', bg)}>
      <p className="text-[13px] font-semibold text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-[32px] font-bold">
        <Num>{value}</Num>
        {unit && <span className="ms-1.5 text-[18px]">{unit}</span>}
      </p>
      <p
        className={cn(
          'text-[13px] font-semibold',
          good === null ? 'text-text-faint' : good ? 'text-lime-strong' : 'text-accent-pressed',
        )}
      >
        {deltaValue === null ? (
          deltaText === 'لا يوجد هدف محدد' ? (
            deltaText
          ) : (
            'لا مقارنة'
          )
        ) : (
          <>
            <Num>{deltaValue}</Num> {deltaText}
          </>
        )}
      </p>
    </div>
  );
}

/** ↓ for a fall, ↑ for a rise. Direction only — colour carries the judgement. */
function arrow(value: number): string {
  return value < 0 ? '↓' : '↑';
}

// ── Chart ────────────────────────────────────────────────────────────────

function WeightChart({ logs, endWeek }: { logs: DailyLogView[]; endWeek: string }) {
  const points = buildTrend(logs, endWeek);
  const { dots, ticks, polyline, gridYs } = trendGeometry(points);

  if (dots.length === 0) {
    return (
      <div className="grid h-[200px] place-items-center rounded-[12px] border border-dashed border-border text-[13.5px] text-text-faint">
        لا توجد أوزان مسجّلة في هذه الفترة
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 640 240"
      className="h-auto w-full overflow-visible"
      style={{ direction: 'ltr' }}
      role="img"
      aria-label={`تطور الوزن عبر ${points.length} أسابيع، من ${dots[0].value} إلى ${dots[dots.length - 1].value} كجم`}
    >
      <g stroke={palette.border} strokeWidth="1">
        {gridYs.map((y) => (
          <line key={y} x1="40" y1={y} x2="620" y2={y} />
        ))}
      </g>

      <polyline
        points={polyline}
        fill="none"
        stroke={palette.accent}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {dots.map((dot) => (
        <g key={dot.label}>
          <circle cx={dot.x} cy={dot.y} r="7" fill={palette.surface} stroke={palette.accent} strokeWidth="4" />
          <text
            x={dot.x}
            y={dot.y - 16}
            textAnchor="middle"
            fontSize="14"
            fontWeight="500"
            fill={palette.textMuted}
            fontFamily="var(--font-plex-arabic)"
          >
            {decimal(dot.value)}
          </text>
        </g>
      ))}

      {ticks.map((tick) => (
        <text
          key={tick.label}
          x={tick.x}
          y="225"
          textAnchor="middle"
          fontSize="12"
          fill={palette.textFaint}
          fontFamily="var(--font-plex-arabic)"
        >
          {tick.label}
        </text>
      ))}
    </svg>
  );
}

// ── Macro bars ───────────────────────────────────────────────────────────

function MacroBars({
  summary,
  plan,
}: {
  summary: WeeklySummaryView;
  plan: ClientProfile['activeNutritionPlan'];
}) {
  // Per-day averages against per-day targets — comparing a weekly total to a
  // daily goal would read as wildly over target.
  // These are labelled rows, not a categorical series: the row's own word
  // says which macro it is, so every bar shares one hue for magnitude and
  // the green is kept for the single meaning of "target reached".
  const bars = [
    { label: 'بروتين', have: summary.nutrition.protein.dailyAverage, goal: plan?.proteinG ?? null, unit: 'g' },
    { label: 'كارب', have: summary.nutrition.carbs.dailyAverage, goal: plan?.carbsG ?? null, unit: 'g' },
    { label: 'فات', have: summary.nutrition.fat.dailyAverage, goal: plan?.fatG ?? null, unit: 'g' },
    { label: 'ماء', have: summary.nutrition.waterL.dailyAverage, goal: plan?.waterMinL ?? null, unit: 'لتر' },
  ];

  return (
    <section className="flex flex-col gap-3.5 rounded-[16px] bg-surface p-6">
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold">
        الماكروز مقابل الهدف
      </h2>

      {bars.map((bar) => {
        const width =
          bar.have !== null && bar.goal ? Math.min(100, Math.round((bar.have / bar.goal) * 100)) : 0;
        const reached = width >= 100;

        return (
          <div key={bar.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13.5px] font-semibold">
              <span>
                {bar.label}
                {reached && <span className="text-lime"> ✓ تحقّق</span>}
              </span>
              <Num className="text-text-muted">
                {bar.have === null ? '—' : decimal(bar.have)} / {bar.goal ?? '—'} {bar.unit}
              </Num>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-alt">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${reached ? 'bg-lime' : 'bg-accent'}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}

      {!plan && (
        <p className="text-[12.5px] text-text-faint">لا توجد خطة غذائية — لا يوجد هدف للمقارنة.</p>
      )}
    </section>
  );
}

// ── Adherence ────────────────────────────────────────────────────────────

function AdherenceCard({ summary }: { summary: WeeklySummaryView }) {
  const days = summary.adherence.days;
  const done = days.filter((day) => day.logged).length;

  const missed = days.filter((day) => !day.logged).map((day) => day.label);
  const gap =
    summary.adherence.rate !== null && summary.previousWeek.adherenceRate !== null
      ? Math.round((summary.adherence.rate - summary.previousWeek.adherenceRate) * 100)
      : null;

  return (
    <section className="flex flex-col gap-3 rounded-[16px] bg-lime-tint p-6">
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-lime-ink-strong">
        الالتزام بالتمارين
      </h2>

      {days.length === 0 ? (
        <p className="text-[14px] leading-relaxed text-lime-ink">
          لا يوجد برنامج تدريبي مُفعّل لهذا الأسبوع.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2.5">
            <Num className="font-[family-name:var(--font-display)] text-[56px] leading-none font-bold text-lime-ink">
              {`${done}/${days.length}`}
            </Num>
            <span className="text-[15px] font-semibold text-lime-strong">
              من <Num>{days.length}</Num> أيام مجدولة
            </span>
          </div>

          <ul className="flex gap-1.5">
            {days.map((day) => (
              <li
                key={day.id}
                title={day.label}
                className={cn(
                  'grid h-10 flex-1 place-items-center rounded-[10px] px-1 text-[12.5px] font-semibold',
                  day.logged ? 'bg-lime-deep text-lime-ink-strong' : 'bg-border text-text-muted',
                )}
              >
                <span className="truncate">{day.label}</span>
              </li>
            ))}
          </ul>

          <p className="text-[13.5px] leading-relaxed text-lime-ink">
            {gap === null ? (
              'لا توجد مقارنة بالأسبوع السابق.'
            ) : gap === 0 ? (
              'نفس مستوى الأسبوع الماضي.'
            ) : (
              <>
                {gap > 0 ? 'تحسّن ' : 'تراجع '}
                <Num>{`${gap > 0 ? '+' : ''}${gap}%`}</Num> عن الأسبوع الماضي.
              </>
            )}
            {missed.length > 0 && <> {missed.join('، ')} هو الأكثر تفويتًا.</>}
          </p>
        </>
      )}
    </section>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────

function ArrowButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-11 flex-none place-items-center rounded-full bg-surface text-[19px]',
        'transition-colors hover:bg-accent-tint',
        // Dimmed rather than hidden at the ends, per the handoff.
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  );
}

function weekTitle(week: string): string {
  const match = /^\d{4}-W(\d{2})$/.exec(week);
  return match ? `أسبوع ${Number(match[1])}` : week;
}

/** ISO week → the Monday and Sunday it spans, as plain dates for the range query. */
function weekStartOf(week: string): string {
  return isoWeekBounds(week).start;
}
function weekEndOf(week: string): string {
  return isoWeekBounds(week).end;
}

function isoWeekBounds(week: string): { start: string; end: string } {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) return { start: todayIso(), end: todayIso() };

  const [, year, number] = match;
  const jan4 = new Date(Date.UTC(Number(year), 0, 4));
  const offset = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(jan4.getTime() - offset * 86_400_000);
  monday.setUTCDate(monday.getUTCDate() + (Number(number) - 1) * 7);

  const sunday = new Date(monday.getTime() + 6 * 86_400_000);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}
