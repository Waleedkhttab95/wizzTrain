'use client';

import type { ClientDailyLogView } from '@wizzapp/shared';
import { useState } from 'react';
import { EmptyState, ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { api } from '@/lib/api';
import { addDaysIso, decimal, num, shortDate, todayIso, weekday } from '@/lib/format';
import { useApi } from '@/lib/useApi';

// Rendered as <Num>{days}</Num> + unit, so the digit is isolated from the
// Arabic word rather than being one mixed string.
const RANGES = [
  { days: 7, unit: 'أيام' },
  { days: 30, unit: 'يوم' },
  { days: 90, unit: 'يوم' },
] as const;

const COLUMNS = ['التاريخ', 'الوزن', 'السعرات', 'بروتين', 'نوم', 'خطوات', 'تمرين'] as const;

/** The daily-log table from the handoff — newest first, scrolls horizontally. */
export function ProfileLogs({ clientId }: { clientId: string }) {
  const [days, setDays] = useState<number>(30);

  const to = todayIso();
  const from = addDaysIso(to, -(days - 1));

  const logs = useApi<ClientDailyLogView[]>(
    (signal) =>
      api.get<ClientDailyLogView[]>(`/clients/${clientId}/daily-logs`, { from, to }, signal),
    [clientId, from, to],
  );

  const rows = [...(logs.data ?? [])].reverse();

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="المدة" className="flex gap-1 self-start rounded-full bg-surface-alt p-1">
        {RANGES.map((range) => {
          const on = days === range.days;
          return (
            <button
              key={range.days}
              onClick={() => setDays(range.days)}
              aria-pressed={on}
              className={cn(
                'rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors duration-150',
                on ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text',
              )}
            >
              <Num>{range.days}</Num> {range.unit}
            </button>
          );
        })}
      </div>

      {logs.loading ? (
        <Loading />
      ) : logs.error ? (
        <ErrorNote message={logs.error.message} onRetry={logs.reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="ما فيه تسجيلات بهالفترة"
          body="بتظهر هنا أرقام المتدرب اليومية أول ما يبدأ يسجّل."
        />
      ) : (
        <div className="overflow-x-auto rounded-[16px] bg-surface p-3">
          <table className="w-full min-w-[620px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-surface-alt">
                {COLUMNS.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={cn(
                      'px-4 py-3.5 text-start font-bold whitespace-nowrap',
                      // Round the outer corners of the header band. In RTL the
                      // first cell is the right-hand end.
                      index === 0 && 'rounded-s-2xl',
                      index === COLUMNS.length - 1 && 'rounded-e-2xl',
                    )}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                    {weekday(row.logDate)} <Num>{shortDate(row.logDate)}</Num>
                  </td>
                  <Cell value={decimal(row.weightKg)} unit="كجم" />
                  <Cell value={num(row.caloriesActual)} />
                  <Cell value={num(row.proteinGActual)} unit="جم" />
                  <Cell value={decimal(row.sleepHours)} unit="س" />
                  <Cell value={num(row.stepsActual)} />
                  <td className="px-4 py-3.5">
                    <span
                      className="rounded-full px-3 py-[5px] text-[12.5px] font-semibold"
                      style={
                        row.workedOut
                          ? { background: 'var(--color-lime-tint)', color: 'var(--color-lime-ink)' }
                          : { background: 'var(--color-accent-tint-2)', color: 'var(--color-accent-tint-ink)' }
                      }
                    >
                      {row.workedOut ? 'تم' : 'فوّت'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes are prose, not a column — they'd wreck the table's rhythm. */}
      {rows.some((row) => row.notes) && (
        <section className="flex flex-col gap-3 rounded-[16px] bg-surface p-6">
          <h3 className="font-[family-name:var(--font-display)] text-[19px] font-bold">ملاحظات</h3>
          <ul className="flex flex-col gap-3">
            {rows
              .filter((row) => row.notes)
              .map((row) => (
                <li key={row.id} className="flex flex-wrap gap-3">
                  <span className="flex-none text-[12.5px] font-bold text-text-faint">
                    <Num>{shortDate(row.logDate)}</Num>
                  </span>
                  <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-text-2">
                    {row.notes}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Cell({ value, unit }: { value: string; unit?: string }) {
  const missing = value === '—';
  return (
    <td className={cn('px-4 py-3.5 whitespace-nowrap', missing ? 'text-text-faint' : 'text-text-2')}>
      {missing ? (
        '—'
      ) : (
        <>
          <Num>{value}</Num>
          {unit && <span className="text-text-faint"> {unit}</span>}
        </>
      )}
    </td>
  );
}
