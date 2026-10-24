import type { WorkoutProgramView } from '@wizzapp/shared';
import { describe, expect, it } from 'vitest';
import {
  diffProgram,
  emptyExercise,
  hasChanges,
  toDraft,
  type Draft,
  type DraftDay,
  type ProgramOp,
} from './programDraft';

// ── Fixtures ─────────────────────────────────────────────────────────────

function exercise(id: string, name: string, orderIndex: number, over: Partial<{ sets: number; reps: string; restInterval: string | null; notes: string | null }> = {}) {
  return {
    id,
    name,
    sets: over.sets ?? 3,
    reps: over.reps ?? '10',
    restInterval: over.restInterval ?? null,
    notes: over.notes ?? null,
    orderIndex,
    // The builder's draft ignores video — it is saved separately, not diffed.
    video: null,
    logs: [],
  };
}

/** Two days, two exercises each — the shape the builder loads. */
function program(): WorkoutProgramView {
  return {
    id: 'p1',
    title: 'برنامج القوة',
    startDate: '2026-09-01',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    days: [
      {
        id: 'd1',
        dayLabel: 'علوي',
        orderIndex: 0,
        exercises: [exercise('e1', 'بنش برس', 0), exercise('e2', 'سحب أرضي', 1)],
      },
      {
        id: 'd2',
        dayLabel: 'سفلي',
        orderIndex: 1,
        exercises: [exercise('e3', 'سكوات', 0)],
      },
    ],
  };
}

const kinds = (ops: ProgramOp[]) => ops.map((op) => op.kind);

/** Index of the first op of a kind, or -1. Used to assert ordering. */
const at = (ops: ProgramOp[], kind: ProgramOp['kind']) => ops.findIndex((op) => op.kind === kind);

describe('toDraft', () => {
  it('round-trips a loaded program into an unchanged draft', () => {
    const original = program();

    expect(diffProgram(original, toDraft(original))).toEqual([]);
    expect(hasChanges(original, toDraft(original))).toBe(false);
  });

  it('renders optional fields as empty strings, not the string "null"', () => {
    const draft = toDraft(program());

    expect(draft.days[0].exercises[0].rest).toBe('');
    expect(draft.days[0].exercises[0].notes).toBe('');
  });

  it('starts blank when the client has no program', () => {
    expect(toDraft(null)).toEqual({ title: '', startDate: '', days: [] });
  });
});

describe('diffProgram — a client with no program yet', () => {
  it('opens the plan by creating the program', () => {
    const draft: Draft = {
      title: 'تنشيف',
      startDate: '2026-09-10',
      days: [{ key: 'k1', id: null, name: 'علوي', exercises: [] }],
    };

    const ops = diffProgram(null, draft);

    expect(ops[0]).toEqual({ kind: 'create-program', title: 'تنشيف', startDate: '2026-09-10' });
  });

  it('creates each day before the exercises that belong to it', () => {
    const draft: Draft = {
      title: 'تنشيف',
      startDate: '2026-09-10',
      days: [
        {
          key: 'k1',
          id: null,
          name: 'علوي',
          exercises: [{ ...emptyExercise(), name: 'بنش برس' }],
        },
      ],
    };

    const ops = diffProgram(null, draft);

    expect(at(ops, 'create-day')).toBeLessThan(at(ops, 'create-exercise'));
  });

  it('marks a new exercise with its day key so the executor can resolve the id', () => {
    const draft: Draft = {
      title: 'ت',
      startDate: '2026-09-10',
      days: [{ key: 'day-x', id: null, name: 'علوي', exercises: [{ ...emptyExercise(), name: 'بنش' }] }],
    };

    const create = diffProgram(null, draft).find((op) => op.kind === 'create-exercise');

    expect(create).toMatchObject({ dayKey: 'day-x', dayId: null });
  });
});

describe('diffProgram — editing an existing program', () => {
  it('emits nothing when nothing changed', () => {
    expect(diffProgram(program(), toDraft(program()))).toEqual([]);
  });

  it('updates only the program fields that actually changed', () => {
    const draft = toDraft(program());
    draft.title = 'برنامج جديد';

    const ops = diffProgram(program(), draft);

    expect(ops).toEqual([{ kind: 'update-program', title: 'برنامج جديد', startDate: undefined }]);
  });

  it('ignores a title that differs only by surrounding whitespace', () => {
    const draft = toDraft(program());
    draft.title = '  برنامج القوة  ';

    expect(diffProgram(program(), draft)).toEqual([]);
  });

  it('renames a day', () => {
    const draft = toDraft(program());
    draft.days[0].name = 'دفع';

    expect(diffProgram(program(), draft)).toEqual([
      { kind: 'update-day', id: 'd1', dayLabel: 'دفع', orderIndex: undefined },
    ]);
  });

  it('updates an exercise that changed', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[0].sets = '5';

    const ops = diffProgram(program(), draft);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ kind: 'update-exercise', id: 'e1' });
    expect((ops[0] as { payload: { sets: number } }).payload.sets).toBe(5);
  });

  it('leaves untouched siblings alone', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[0].name = 'بنش برس مائل';

    const ops = diffProgram(program(), draft);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ id: 'e1' });
  });
});

describe('diffProgram — deletions', () => {
  it('deletes a removed day', () => {
    const draft = toDraft(program());
    draft.days = draft.days.filter((day) => day.id !== 'd2');

    expect(diffProgram(program(), draft)).toContainEqual({ kind: 'delete-day', id: 'd2' });
  });

  it('does not also delete the exercises of a deleted day — the schema cascades', () => {
    const draft = toDraft(program());
    draft.days = draft.days.filter((day) => day.id !== 'd1');

    const ops = diffProgram(program(), draft);

    expect(ops.filter((op) => op.kind === 'delete-exercise')).toEqual([]);
  });

  it('deletes a removed exercise', () => {
    const draft = toDraft(program());
    draft.days[0].exercises = draft.days[0].exercises.filter((e) => e.id !== 'e2');

    expect(diffProgram(program(), draft)).toContainEqual({ kind: 'delete-exercise', id: 'e2' });
  });

  it('puts every deletion before any creation', () => {
    const draft = toDraft(program());
    draft.days[0].exercises = [{ ...emptyExercise(), name: 'تمرين جديد' }];

    const ops = diffProgram(program(), draft);
    const lastDelete = ops.map((o) => o.kind).lastIndexOf('delete-exercise');

    expect(lastDelete).toBeLessThan(at(ops, 'create-exercise'));
  });

  it('renumbers the exercises that remain', () => {
    const draft = toDraft(program());
    // Drop the first, so the second must move from orderIndex 1 to 0.
    draft.days[0].exercises = draft.days[0].exercises.filter((e) => e.id !== 'e1');

    const ops = diffProgram(program(), draft);

    expect(ops).toContainEqual({ kind: 'delete-exercise', id: 'e1' });
    expect(ops).toContainEqual({
      kind: 'update-exercise',
      id: 'e2',
      payload: { name: 'سحب أرضي', sets: 3, reps: '10', restInterval: undefined, notes: undefined, orderIndex: 0 },
    });
  });
});

describe('diffProgram — blank rows', () => {
  it('never saves a row with no name', () => {
    const draft = toDraft(program());
    draft.days[0].exercises.push(emptyExercise());

    expect(diffProgram(program(), draft)).toEqual([]);
  });

  it('treats a whitespace-only name as blank', () => {
    const draft = toDraft(program());
    draft.days[0].exercises.push({ ...emptyExercise(), name: '   ' });

    expect(diffProgram(program(), draft)).toEqual([]);
  });

  it('does not let a blank row consume an orderIndex', () => {
    const draft = toDraft(program());
    // Blank row inserted between the two real ones.
    draft.days[0].exercises.splice(1, 0, emptyExercise());

    // e2 stays at index 1 because the blank is skipped, so nothing to update.
    expect(diffProgram(program(), draft)).toEqual([]);
  });

  it('deletes a saved exercise whose name was cleared', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[1].name = '';

    expect(diffProgram(program(), draft)).toContainEqual({ kind: 'delete-exercise', id: 'e2' });
  });
});

describe('diffProgram — reordering', () => {
  it('renumbers days that moved', () => {
    const draft = toDraft(program());
    draft.days.reverse();

    const ops = diffProgram(program(), draft);

    expect(ops).toContainEqual({ kind: 'update-day', id: 'd2', dayLabel: undefined, orderIndex: 0 });
    expect(ops).toContainEqual({ kind: 'update-day', id: 'd1', dayLabel: undefined, orderIndex: 1 });
  });

  it('renumbers exercises that moved within a day', () => {
    const draft = toDraft(program());
    draft.days[0].exercises.reverse();

    const ops = diffProgram(program(), draft);
    const indexes = ops
      .filter((op): op is Extract<ProgramOp, { kind: 'update-exercise' }> => op.kind === 'update-exercise')
      .map((op) => [op.id, op.payload.orderIndex]);

    expect(indexes).toEqual([
      ['e2', 0],
      ['e1', 1],
    ]);
  });

  it('does not touch days whose position is unchanged', () => {
    const draft = toDraft(program());
    draft.days[1].name = 'سفلي';

    expect(diffProgram(program(), draft)).toEqual([]);
  });
});

describe('diffProgram — value coercion', () => {
  it('falls back to one set when the field is blank or junk', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[0].sets = '';

    const op = diffProgram(program(), draft)[0] as Extract<ProgramOp, { kind: 'update-exercise' }>;

    expect(op.payload.sets).toBe(1);
  });

  it('sends undefined rather than an empty string for optional fields', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[0].name = 'بنش برس مائل';

    const op = diffProgram(program(), draft)[0] as Extract<ProgramOp, { kind: 'update-exercise' }>;

    expect(op.payload.restInterval).toBeUndefined();
    expect(op.payload.notes).toBeUndefined();
  });

  it('substitutes a placeholder when reps is left empty, which the API requires', () => {
    const draft = toDraft(program());
    draft.days[0].exercises[0].reps = '';

    const op = diffProgram(program(), draft)[0] as Extract<ProgramOp, { kind: 'update-exercise' }>;

    expect(op.payload.reps).toBe('-');
  });

  it('falls back to a numbered label when the day name is cleared', () => {
    const draft = toDraft(program());
    draft.days[1].name = '   ';

    expect(diffProgram(program(), draft)).toContainEqual({
      kind: 'update-day',
      id: 'd2',
      dayLabel: 'يوم 2',
      orderIndex: undefined,
    });
  });
});

describe('diffProgram — a realistic multi-edit session', () => {
  it('sequences every kind of change correctly in one plan', () => {
    const original = program();
    const draft = toDraft(original);

    draft.title = 'برنامج التنشيف';                              // update-program
    draft.days[0].name = 'دفع';                                  // update-day
    draft.days[0].exercises[0].sets = '5';                       // update-exercise
    draft.days[0].exercises.splice(1, 1);                        // delete-exercise (e2)
    draft.days[0].exercises.push({ ...emptyExercise(), name: 'تفتيح' }); // create-exercise
    draft.days.splice(1, 1);                                     // delete-day (d2)
    draft.days.push({ key: 'new-day', id: null, name: 'كارديو', exercises: [{ ...emptyExercise(), name: 'جري' }] } as DraftDay);

    const ops = diffProgram(original, draft);

    expect(kinds(ops)).toEqual([
      'update-program',
      'delete-day',
      'delete-exercise',
      'update-day',
      'create-day',
      'update-exercise',
      'create-exercise',
      'create-exercise',
    ]);

    // The new day must be created before the exercise that references it.
    expect(at(ops, 'create-day')).toBeLessThan(
      ops.findIndex((op) => op.kind === 'create-exercise' && op.dayKey === 'new-day'),
    );
  });
});
