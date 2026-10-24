'use client';

import type { ClientProfile, ExerciseItemView, WorkoutProgramView } from '@wizzapp/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHead } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, TextArea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api';
import { longDate, todayIso } from '@/lib/format';

type DayView = WorkoutProgramView['days'][number];

export function ProgramBuilder({
  client,
  onChanged,
}: {
  client: ClientProfile;
  onChanged: () => void;
}) {
  const { notify } = useToast();
  const program = client.activeProgram;

  const [creating, setCreating] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [exerciseFor, setExerciseFor] = useState<DayView | null>(null);
  const [editing, setEditing] = useState<ExerciseItemView | null>(null);

  function fail(caught: unknown, fallback: string) {
    notify(caught instanceof ApiError ? caught.message : fallback, 'bad');
  }

  async function removeDay(day: DayView) {
    if (!confirm(`حذف يوم "${day.dayLabel}" وكل تمارينه؟`)) return;
    try {
      await api.del(`/days/${day.id}`);
      notify('تم حذف اليوم');
      onChanged();
    } catch (caught) {
      fail(caught, 'تعذّر حذف اليوم');
    }
  }

  async function removeExercise(exercise: ExerciseItemView) {
    if (!confirm(`حذف تمرين "${exercise.name}"؟`)) return;
    try {
      await api.del(`/exercises/${exercise.id}`);
      notify('تم حذف التمرين');
      onChanged();
    } catch (caught) {
      fail(caught, 'تعذّر حذف التمرين');
    }
  }

  if (!program) {
    return (
      <>
        <EmptyState
          title="لا يوجد برنامج تدريبي"
          body="أنشئ برنامجًا ثم أضف أيام التدريب والتمارين. سيظهر للمتدرب فور إنشائه."
          action={
            <Button variant="blaze" onClick={() => setCreating(true)}>
              إنشاء برنامج
            </Button>
          }
        />
        <ProgramDialog
          open={creating}
          clientId={client.id}
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            onChanged();
          }}
        />
      </>
    );
  }

  const totalExercises = program.days.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card raised>
        <CardHead
          title={program.title}
          label={`STARTED ${program.startDate}`}
          action={
            <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
              برنامج جديد
            </Button>
          }
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 text-[13px] text-muted">
          <span className="tnum">
            <span className="font-bold text-text">{program.days.length}</span> أيام
          </span>
          <span className="tnum">
            <span className="font-bold text-text">{totalExercises}</span> تمرين
          </span>
          <span>بدأ {longDate(program.startDate)}</span>
        </div>
      </Card>

      {program.days.length === 0 ? (
        <EmptyState
          title="البرنامج فارغ"
          body="أضف أول يوم تدريبي — مثل «الصدر والتراي» أو «الأرجل»."
          action={
            <Button variant="blaze" onClick={() => setAddingDay(true)}>
              إضافة يوم
            </Button>
          }
        />
      ) : (
        <>
          {program.days.map((day) => (
            <Card key={day.id}>
              <CardHead
                title={day.dayLabel}
                label={`DAY ${day.orderIndex + 1}`}
                action={
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setExerciseFor(day)}>
                      + تمرين
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeDay(day)} aria-label="حذف اليوم">
                      🗑
                    </Button>
                  </div>
                }
              />

              {day.exercises.length === 0 ? (
                <p className="px-5 py-6 text-center text-[13.5px] text-faint">لا توجد تمارين بعد.</p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {day.exercises.map((exercise, index) => (
                    <li key={exercise.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="stat-num grid size-7 shrink-0 place-items-center rounded-md bg-surface-2 text-[13px] text-faint">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-bold">{exercise.name}</p>
                        <p className="tnum mt-0.5 text-[12.5px] text-muted">
                          {exercise.sets} × {exercise.reps}
                          {exercise.restInterval && ` · راحة ${exercise.restInterval}`}
                          {exercise.logs.length > 0 && (
                            <span className="text-good"> · {exercise.logs.length} تسجيل</span>
                          )}
                        </p>
                        {exercise.notes && (
                          <p className="mt-1 text-[12.5px] text-faint">{exercise.notes}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => setEditing(exercise)}
                          className="rounded-md px-2 py-1 text-[12px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => removeExercise(exercise)}
                          className="rounded-md px-2 py-1 text-[12px] font-semibold text-faint transition-colors hover:bg-bad-ghost hover:text-bad"
                        >
                          حذف
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}

          <Button variant="solid" onClick={() => setAddingDay(true)} full>
            + إضافة يوم تدريبي
          </Button>
        </>
      )}

      <ProgramDialog
        open={creating}
        clientId={client.id}
        onClose={() => setCreating(false)}
        onDone={() => {
          setCreating(false);
          onChanged();
        }}
      />

      <DayDialog
        open={addingDay}
        programId={program.id}
        onClose={() => setAddingDay(false)}
        onDone={() => {
          setAddingDay(false);
          onChanged();
        }}
      />

      <ExerciseDialog
        day={exerciseFor}
        editing={editing}
        onClose={() => {
          setExerciseFor(null);
          setEditing(null);
        }}
        onDone={() => {
          setExerciseFor(null);
          setEditing(null);
          onChanged();
        }}
      />
    </div>
  );
}

/** Creating a program retires the client's previous one — say so plainly. */
function ProgramDialog({
  open,
  clientId,
  onClose,
  onDone,
}: {
  open: boolean;
  clientId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/clients/${clientId}/programs`, { title: title.trim(), startDate });
      notify('تم إنشاء البرنامج');
      setTitle('');
      onDone();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر إنشاء البرنامج', 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="برنامج تدريبي جديد"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="blaze" onClick={submit} loading={saving}>
            إنشاء
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="اسم البرنامج"
          placeholder="برنامج التضخيم — المرحلة الأولى"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Field
          label="تاريخ البدء"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <p className="rounded-lg border border-warn/25 bg-warn-ghost px-3.5 py-2.5 text-[13px] leading-relaxed text-warn">
          إنشاء برنامج جديد يوقف البرنامج الحالي — سيرى المتدرب البرنامج الجديد فقط.
        </p>
      </form>
    </Modal>
  );
}

function DayDialog({
  open,
  programId,
  onClose,
  onDone,
}: {
  open: boolean;
  programId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      // orderIndex is omitted deliberately — the API appends to the end.
      await api.post(`/programs/${programId}/days`, { dayLabel: label.trim() });
      notify('تمت إضافة اليوم');
      setLabel('');
      onDone();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر إضافة اليوم', 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="يوم تدريبي جديد"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="blaze" onClick={submit} loading={saving}>
            إضافة
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field
          label="اسم اليوم"
          placeholder="الصدر والتراي"
          hint="يُضاف في نهاية قائمة الأيام."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}

function ExerciseDialog({
  day,
  editing,
  onClose,
  onDone,
}: {
  day: DayView | null;
  editing: ExerciseItemView | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const open = day !== null || editing !== null;

  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('');
  const [rest, setRest] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Seed the form from the exercise being edited, once per dialog opening.
  const key = editing?.id ?? day?.id ?? null;
  if (open && key !== loadedFor) {
    setLoadedFor(key);
    setName(editing?.name ?? '');
    setSets(String(editing?.sets ?? 3));
    setReps(editing?.reps ?? '');
    setRest(editing?.restInterval ?? '');
    setNotes(editing?.notes ?? '');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    const body = {
      name: name.trim(),
      sets: Number(sets),
      reps: reps.trim(),
      restInterval: rest.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (editing) {
        await api.patch(`/exercises/${editing.id}`, body);
        notify('تم تحديث التمرين');
      } else if (day) {
        await api.post(`/days/${day.id}/exercises`, body);
        notify('تمت إضافة التمرين');
      }
      setLoadedFor(null);
      onDone();
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : 'تعذّر حفظ التمرين', 'bad');
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setLoadedFor(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? 'تعديل التمرين' : `تمرين جديد${day ? ` — ${day.dayLabel}` : ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            إلغاء
          </Button>
          <Button variant="blaze" onClick={submit} loading={saving}>
            {editing ? 'حفظ' : 'إضافة'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="اسم التمرين"
          placeholder="بنش برس"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="عدد المجموعات"
            suffix="SETS"
            type="number"
            inputMode="numeric"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            required
          />
          <Field
            label="التكرارات"
            suffix="REPS"
            placeholder="8-10"
            hint="نص حر: 8-10 أو AMRAP"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            required
          />
        </div>
        <Field
          label="فترة الراحة"
          placeholder="90 ثانية"
          value={rest}
          onChange={(e) => setRest(e.target.value)}
        />
        <TextArea
          label="ملاحظات"
          placeholder="ركّز على النزول البطيء"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
}
