import type { WorkoutProgramView } from '@wizzapp/shared';

/**
 * The program builder edits a local draft and commits it with one "حفظ
 * البرنامج", but the API is granular (a route per day and per exercise). This
 * module turns "what the trainer left on screen" into the ordered list of
 * calls that gets the server there.
 *
 * Keeping it pure means the ordering rules — create a day before its
 * exercises, delete before renumbering — are testable without a network.
 */

export interface DraftExercise {
  /** Stable React key. Survives reordering; unrelated to the server id. */
  key: string;
  /** null until the exercise has been saved for the first time. */
  id: string | null;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
}

export interface DraftDay {
  key: string;
  id: string | null;
  name: string;
  exercises: DraftExercise[];
}

export interface Draft {
  title: string;
  startDate: string;
  days: DraftDay[];
}

let counter = 0;
export function newKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function emptyExercise(): DraftExercise {
  return { key: newKey('ex'), id: null, name: '', sets: '3', reps: '', rest: '', notes: '' };
}

export function emptyDay(index: number): DraftDay {
  return { key: newKey('day'), id: null, name: `يوم ${index + 1}`, exercises: [emptyExercise()] };
}

/** Server shape → editable draft. */
export function toDraft(program: WorkoutProgramView | null): Draft {
  if (!program) {
    return { title: '', startDate: '', days: [] };
  }

  return {
    title: program.title,
    startDate: program.startDate,
    days: program.days.map((day) => ({
      key: `day-${day.id}`,
      id: day.id,
      name: day.dayLabel,
      exercises: day.exercises.map((exercise) => ({
        key: `ex-${exercise.id}`,
        id: exercise.id,
        name: exercise.name,
        sets: String(exercise.sets),
        reps: exercise.reps,
        rest: exercise.restInterval ?? '',
        notes: exercise.notes ?? '',
      })),
    })),
  };
}

// ── The operation plan ───────────────────────────────────────────────────

export interface ExercisePayload {
  name: string;
  sets: number;
  reps: string;
  restInterval?: string;
  notes?: string;
  orderIndex: number;
}

export type ProgramOp =
  | { kind: 'create-program'; title: string; startDate: string }
  | { kind: 'update-program'; title?: string; startDate?: string }
  | { kind: 'delete-day'; id: string }
  | { kind: 'delete-exercise'; id: string }
  | { kind: 'create-day'; dayKey: string; dayLabel: string; orderIndex: number }
  | { kind: 'update-day'; id: string; dayLabel?: string; orderIndex?: number }
  /** `dayId` is null when the day is created earlier in this same plan. */
  | { kind: 'create-exercise'; dayKey: string; dayId: string | null; payload: ExercisePayload }
  | { kind: 'update-exercise'; id: string; payload: ExercisePayload };

/** An exercise row the trainer left blank is dropped rather than saved empty. */
export function isBlank(exercise: DraftExercise): boolean {
  return exercise.name.trim() === '';
}

function payloadOf(exercise: DraftExercise, orderIndex: number): ExercisePayload {
  const sets = Number.parseInt(exercise.sets, 10);
  return {
    name: exercise.name.trim(),
    // The API requires at least one set; a blank or junk value means "1".
    sets: Number.isFinite(sets) && sets > 0 ? sets : 1,
    reps: exercise.reps.trim() || '-',
    restInterval: exercise.rest.trim() || undefined,
    notes: exercise.notes.trim() || undefined,
    orderIndex,
  };
}

function samePayload(a: ExercisePayload, b: ExercisePayload): boolean {
  return (
    a.name === b.name &&
    a.sets === b.sets &&
    a.reps === b.reps &&
    a.restInterval === b.restInterval &&
    a.notes === b.notes &&
    a.orderIndex === b.orderIndex
  );
}

/**
 * Diffs the draft against the program that was loaded, producing operations in
 * an order the API can execute top to bottom.
 *
 * `original` is null when the client has no program yet, in which case the plan
 * opens with `create-program`.
 */
export function diffProgram(original: WorkoutProgramView | null, draft: Draft): ProgramOp[] {
  const ops: ProgramOp[] = [];

  if (!original) {
    ops.push({
      kind: 'create-program',
      title: draft.title.trim(),
      startDate: draft.startDate,
    });
  } else {
    const title = draft.title.trim() !== original.title ? draft.title.trim() : undefined;
    const startDate = draft.startDate !== original.startDate ? draft.startDate : undefined;
    if (title !== undefined || startDate !== undefined) {
      ops.push({ kind: 'update-program', title, startDate });
    }
  }

  const originalDays = original?.days ?? [];
  const keptDayIds = new Set(draft.days.map((day) => day.id).filter(Boolean));

  // Deletions first: removing a day takes its exercises with it (the schema
  // cascades), so those exercises must not also be deleted individually.
  for (const day of originalDays) {
    if (!keptDayIds.has(day.id)) {
      ops.push({ kind: 'delete-day', id: day.id });
    }
  }

  for (const draftDay of draft.days) {
    const originalDay = originalDays.find((day) => day.id === draftDay.id);
    if (!originalDay) continue;

    const kept = new Set(draftDay.exercises.filter((e) => !isBlank(e)).map((e) => e.id));
    for (const exercise of originalDay.exercises) {
      if (!kept.has(exercise.id)) {
        ops.push({ kind: 'delete-exercise', id: exercise.id });
      }
    }
  }

  // Then days, so a new day exists before anything is added to it.
  draft.days.forEach((draftDay, dayIndex) => {
    const label = draftDay.name.trim() || `يوم ${dayIndex + 1}`;

    if (draftDay.id === null) {
      ops.push({ kind: 'create-day', dayKey: draftDay.key, dayLabel: label, orderIndex: dayIndex });
    } else {
      const originalDay = originalDays.find((day) => day.id === draftDay.id);
      const dayLabel = originalDay && label !== originalDay.dayLabel ? label : undefined;
      const orderIndex =
        originalDay && dayIndex !== originalDay.orderIndex ? dayIndex : undefined;
      if (dayLabel !== undefined || orderIndex !== undefined) {
        ops.push({ kind: 'update-day', id: draftDay.id, dayLabel, orderIndex });
      }
    }
  });

  // Finally exercises.
  draft.days.forEach((draftDay) => {
    const originalDay = originalDays.find((day) => day.id === draftDay.id);
    let orderIndex = 0;

    for (const exercise of draftDay.exercises) {
      if (isBlank(exercise)) continue;

      const payload = payloadOf(exercise, orderIndex);
      orderIndex += 1;

      if (exercise.id === null) {
        ops.push({
          kind: 'create-exercise',
          dayKey: draftDay.key,
          dayId: draftDay.id,
          payload,
        });
        continue;
      }

      const before = originalDay?.exercises.find((e) => e.id === exercise.id);
      if (!before) continue;

      const previous = payloadOf(
        {
          key: '',
          id: before.id,
          name: before.name,
          sets: String(before.sets),
          reps: before.reps,
          rest: before.restInterval ?? '',
          notes: before.notes ?? '',
        },
        before.orderIndex,
      );

      if (!samePayload(previous, payload)) {
        ops.push({ kind: 'update-exercise', id: exercise.id, payload });
      }
    }
  });

  return ops;
}

/** Whether committing this draft would change anything on the server. */
export function hasChanges(original: WorkoutProgramView | null, draft: Draft): boolean {
  return diffProgram(original, draft).length > 0;
}
