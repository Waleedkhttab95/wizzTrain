'use client';

import type { ExerciseItemView, ExerciseLogView } from '@wizzapp/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Badge } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { decimal, todayIso } from '@/lib/format';

function localDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * One exercise, with the log form folded into it. The client is standing at a
 * rack with one hand free, so logging is two fields and a button — no dialog,
 * no navigation.
 */
export function ExerciseCard({
  index,
  exercise,
  onLogged,
}: {
  index: number;
  exercise: ExerciseItemView;
  onLogged: (updated: ExerciseItemView) => void;
}) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);

  const today = todayIso();
  const todayLogs = exercise.logs.filter((log) => localDate(log.completedAt) === today);
  const done = todayLogs.length > 0;
  const lastLog = exercise.logs[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<ExerciseLogView>(`/exercises/${exercise.id}/logs`, {
        // Both fields are optional — a bodyweight set can log reps alone.
        actualWeightKg: weight === '' ? undefined : Number(weight),
        actualReps: reps.trim() === '' ? undefined : reps.trim(),
      });

      onLogged({ ...exercise, logs: [created, ...exercise.logs] });
      notify('تم تسجيل التمرين');
      setOpen(false);
      setWeight('');
      setReps('');
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر حفظ التمرين', 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card as="li" raised className={cn('overflow-hidden', done && 'border-good/25')}>
      <div className="flex items-start gap-3.5 px-4 py-4">
        <span
          className={cn(
            'stat-num grid size-9 shrink-0 place-items-center rounded-lg text-[15px]',
            done ? 'bg-good-ghost text-good' : 'bg-surface-2 text-faint',
          )}
        >
          {done ? '✓' : index}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15.5px] font-bold">{exercise.name}</h3>
            {done && <Badge tone="good">تم اليوم</Badge>}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span className="tnum">
              <span className="text-text">{exercise.sets}</span> مجموعات
            </span>
            <span className="text-line">·</span>
            <span className="tnum">
              <span className="text-text">{exercise.reps}</span> تكرار
            </span>
            {exercise.restInterval && (
              <>
                <span className="text-line">·</span>
                <span>راحة {exercise.restInterval}</span>
              </>
            )}
          </div>

          {exercise.notes && (
            <p className="mt-2 rounded-lg border-s-2 border-blaze/40 bg-surface-2 px-3 py-2 text-[13px] leading-relaxed text-muted">
              {exercise.notes}
            </p>
          )}

          {/* What they lifted last time — the number they're trying to beat. */}
          {lastLog && !done && (
            <p className="tnum mt-2 text-[12.5px] text-faint">
              آخر مرة: {lastLog.actualWeightKg !== null ? `${decimal(lastLog.actualWeightKg)} كجم` : '—'}
              {lastLog.actualReps ? ` × ${lastLog.actualReps}` : ''}
            </p>
          )}

          {todayLogs.length > 0 && (
            <ul className="tnum mt-2 flex flex-wrap gap-1.5">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-md border border-good/25 bg-good-ghost px-2 py-0.5 text-[12px] font-semibold text-good"
                >
                  {log.actualWeightKg !== null ? `${decimal(log.actualWeightKg)} كجم` : 'وزن الجسم'}
                  {log.actualReps ? ` × ${log.actualReps}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {open ? (
        <form onSubmit={submit} className="flex flex-col gap-3 border-t border-line-soft bg-surface-2 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="الوزن"
              suffix="KG"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              placeholder="40"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Field
              label="التكرارات"
              suffix="PER SET"
              inputMode="text"
              placeholder="10/9/9"
              hint="رقم لكل مجموعة"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="blaze" loading={saving} full>
              حفظ
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'w-full border-t border-line-soft py-3 text-[13.5px] font-bold transition-colors',
            done ? 'text-faint hover:text-muted' : 'text-blaze hover:bg-blaze-ghost',
          )}
        >
          {done ? 'تسجيل مجموعة أخرى' : 'تسجيل التمرين'}
        </button>
      )}
    </Card>
  );
}
