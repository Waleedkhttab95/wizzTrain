'use client';

import type { DailyLogView, NutritionPlanView } from '@wizzapp/shared';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ErrorNote, Loading } from '@/components/ui/Feedback';
import { Num } from '@/components/ui/Num';
import { cn } from '@/components/ui/cn';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { addDaysIso, longDate, todayIso } from '@/lib/format';
import {
  FIELDS,
  NOTE_CHIPS,
  adjust,
  buildPayload,
  compareLine,
  formatValue,
  hintFor,
  seedValues,
  type FieldKey,
  type Values,
} from '@/lib/logWizard';
import { computeStreak, logFor, previousLog, streakDots } from '@/lib/streak';
import { useApi } from '@/lib/useApi';
import { palette } from '@/lib/palette';

type Phase = 'steps' | 'done';

export default function LogWizardPage() {
  const { notify } = useToast();
  const today = todayIso();
  const yesterday = addDaysIso(today, -1);

  const [date, setDate] = useState(today);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('steps');
  const [values, setValues] = useState<Values>({});
  const [note, setNote] = useState('');
  const [skipped, setSkipped] = useState<Set<FieldKey>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const [seconds, setSeconds] = useState(0);

  // Two weeks covers the streak and gives the wizard a value to carry over.
  const logs = useApi<DailyLogView[]>(
    (signal) =>
      api.get<DailyLogView[]>('/daily-logs/me', { from: addDaysIso(today, -13), to: today }, signal),
    [today],
  );

  const plan = useApi<NutritionPlanView | null>(
    (signal) =>
      api.get<NutritionPlanView>('/nutrition-plan/active', undefined, signal).catch(() => null),
    [],
  );

  const existing = useMemo(() => logFor(logs.data ?? [], date), [logs.data, date]);
  const previous = useMemo(() => previousLog(logs.data ?? [], date), [logs.data, date]);

  // Seed once the history arrives, and again whenever the client switches day.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!logs.data) return;
    if (seededFor.current === date) return;
    seededFor.current = date;
    setValues(seedValues(existing, previous));
    setNote(existing?.notes ?? '');
    setSkipped(new Set());
    startedAt.current = Date.now();
  }, [logs.data, date, existing, previous]);

  const spec = FIELDS[step];
  const isNote = spec.key === 'note';
  const total = FIELDS.length;

  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  function skip() {
    setSkipped((current) => new Set(current).add(spec.key));
    advance();
  }

  function advance() {
    if (step < total - 1) {
      setStep(step + 1);
      return;
    }
    void submit();
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body = buildPayload(date, values, note, skipped, existing);
      await api.post<DailyLogView>('/daily-logs', body);
      setSeconds(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
      setPhase('done');
      logs.reload();
    } catch (caught) {
      const message =
        caught instanceof ApiError ? (caught.fieldMessages[0] ?? caught.message) : 'تعذّر الحفظ';
      setError(message);
      notify(message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  function restart() {
    setPhase('steps');
    setStep(0);
    seededFor.current = null;
    startedAt.current = Date.now();
  }

  if (logs.loading && !logs.data) return <Loading />;

  if (phase === 'done') {
    return <DoneScreen logs={logs.data ?? []} seconds={seconds} onEdit={restart} />;
  }

  const value = values[spec.key] ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-3.5 px-5 pt-5.5 pb-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={back}
            disabled={step === 0}
            title="السابق"
            aria-label="الخطوة السابقة"
            className="grid size-11 flex-none place-items-center rounded-full bg-surface-alt text-[18px] transition-colors hover:bg-border disabled:opacity-40"
          >
            &#8594;
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-text-muted">
              تسجيل {date === today ? 'اليوم' : 'أمس'} · خطوة <Num>{step + 1}</Num> من{' '}
              <Num>{total}</Num>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Back-fill yesterday — the API allows editing today and yesterday. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-semibold text-text-faint">تسجيل يوم:</span>
          <div className="flex gap-1.5 rounded-full bg-surface-alt p-1">
            {[
              { value: today, label: 'اليوم' },
              { value: yesterday, label: 'أمس' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDate(option.value)}
                aria-pressed={date === option.value}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  date === option.value ? 'bg-accent text-accent-ink' : 'text-text-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-[12.5px] text-text-faint">{longDate(date)}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 px-5 pt-2.5 pb-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <span className="grid size-14 place-items-center rounded-full bg-accent-tint font-[family-name:var(--font-display)] text-[22px] font-bold text-accent-pressed">
            <Num>{step + 1}</Num>
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-[1.2] font-bold">
            {spec.question}
          </h1>
          <p className="text-[13.5px] text-text-muted">{hintFor(spec, plan.data)}</p>
        </div>

        {error && <ErrorNote message={error} />}

        {isNote ? (
          <div className="flex flex-col gap-3">
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: نمت متأخر، التمرين كان ثقيل شوي."
              className="resize-y rounded-[14px] border border-border bg-input-bg px-4.5 py-3.5 text-right text-[15.5px] leading-relaxed transition-colors placeholder:text-placeholder focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {NOTE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setNote((current) => (current ? `${current}، ${chip}` : chip))}
                  className="rounded-full border border-border bg-surface px-4 py-2.5 text-[14px] font-semibold text-text-2 transition-colors hover:border-accent-tint-3 hover:bg-accent-tint"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4.5">
            <div className="flex w-full items-center justify-center gap-3.5">
              <StepButton
                onClick={() => setValues((v) => ({ ...v, [spec.key]: adjust(spec, value, -spec.step) }))}
                label={`إنقاص ${spec.question}`}
              >
                −
              </StepButton>

              <div className="flex min-w-0 flex-1 flex-col items-center">
                <Num
                  className="font-[family-name:var(--font-display)] text-[62px] leading-none font-bold"
                  aria-live="polite"
                >
                  {formatValue(spec, value)}
                </Num>
                <span className="mt-1 text-[15px] font-semibold text-text-muted">{spec.unit}</span>
              </div>

              <StepButton
                onClick={() => setValues((v) => ({ ...v, [spec.key]: adjust(spec, value, spec.step) }))}
                label={`زيادة ${spec.question}`}
              >
                +
              </StepButton>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {spec.quick.map((delta) => (
                <button
                  key={delta}
                  dir="ltr"
                  onClick={() => setValues((v) => ({ ...v, [spec.key]: adjust(spec, value, delta) }))}
                  className="rounded-full border border-border bg-surface px-4.5 py-2.5 text-[14.5px] font-semibold text-text-2 tabular-nums transition-colors hover:border-accent-tint-3 hover:bg-accent-tint"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            <p className="text-[12.5px] text-text-faint">
              <Num>{compareLine(spec, previous)}</Num>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={advance}
            disabled={saving}
            className="h-[60px] rounded-full bg-accent font-[family-name:var(--font-display)] text-[20px] font-bold text-accent-ink shadow-[0_2px_6px_rgba(44,24,16,.12)] transition-colors hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60"
          >
            {saving ? 'جارٍ الإرسال…' : step === total - 1 ? 'خلّصنا — أرسل لمدربي' : 'التالي'}
          </button>
          <button
            onClick={skip}
            disabled={saving}
            className="p-2 text-[14px] font-semibold text-text-muted transition-colors hover:text-accent-pressed"
          >
            تخطّي هذا الحقل
          </button>
        </div>
      </div>
    </div>
  );
}

function StepButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid size-[62px] flex-none place-items-center rounded-full bg-surface-alt text-[30px] font-bold transition-colors hover:bg-border"
    >
      {children}
    </button>
  );
}

function DoneScreen({
  logs,
  seconds,
  onEdit,
}: {
  logs: DailyLogView[];
  seconds: number;
  onEdit: () => void;
}) {
  const streak = computeStreak(logs);
  const dots = streakDots(logs);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4.5 px-6 pt-5 pb-7.5 text-center">
      <div className="grid size-23 place-items-center rounded-full bg-lime-tint">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={palette.successStrong} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12.5 9 17.5 20 6.5" />
        </svg>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-[1.2] font-bold text-balance">
        تم التسجيل في <Num>{seconds}</Num> ثانية
      </h1>

      <p className="max-w-[300px] text-[14.5px] leading-[1.7] text-text-muted">
        وصل لمدربك على طول.
        {streak.length > 1 && (
          <>
            {' '}
            سلسلتك صارت <Num>{streak.length}</Num> أيام متتابعة.
          </>
        )}
      </p>

      <div className="flex gap-1.5" role="img" aria-label={`سجّلت ${dots.filter(Boolean).length} من آخر 7 أيام`}>
        {dots.map((filled, index) => (
          <span
            key={index}
            className={cn('size-[26px] rounded-full', filled ? 'bg-lime' : 'bg-surface-alt')}
          />
        ))}
      </div>

      <div className="flex w-full max-w-[320px] flex-col gap-2.5">
        <Link
          href="/client"
          className="grid h-14 place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] text-[19px] font-bold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          رجوع للرئيسية
        </Link>
        <button
          onClick={onEdit}
          className="h-13 rounded-full border border-[rgba(255,255,255,.16)] text-[15px] font-semibold transition-colors hover:bg-[rgba(255,255,255,.07)]"
        >
          تعديل ما سجّلته
        </button>
      </div>
    </div>
  );
}
