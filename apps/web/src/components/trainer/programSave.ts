import type { WorkoutProgramView } from '@wizzapp/shared';
import { api } from '@/lib/api';
import type { Draft, ProgramOp } from './programDraft';
import { diffProgram } from './programDraft';

/**
 * Applies a plan from `diffProgram` against the API.
 *
 * Runs strictly in order — the plan already sequences deletes before creates
 * and days before their exercises — and threads the ids of freshly created
 * days through to the exercises that belong to them.
 */
export async function saveProgram(
  clientId: string,
  original: WorkoutProgramView | null,
  draft: Draft,
): Promise<void> {
  const ops = diffProgram(original, draft);
  if (ops.length === 0) return;

  let programId = original?.id ?? null;
  // Days created during this run: draft key → the id the server assigned.
  const createdDays = new Map<string, string>();

  for (const op of ops) {
    switch (op.kind) {
      case 'create-program': {
        const created = await api.post<WorkoutProgramView>(`/clients/${clientId}/programs`, {
          title: op.title,
          startDate: op.startDate,
        });
        programId = created.id;
        break;
      }

      case 'update-program':
        await api.patch(`/programs/${requireProgram(programId)}`, {
          ...(op.title !== undefined && { title: op.title }),
          ...(op.startDate !== undefined && { startDate: op.startDate }),
        });
        break;

      case 'delete-day':
        await api.del(`/days/${op.id}`);
        break;

      case 'delete-exercise':
        await api.del(`/exercises/${op.id}`);
        break;

      case 'create-day': {
        const day = await api.post<{ id: string }>(`/programs/${requireProgram(programId)}/days`, {
          dayLabel: op.dayLabel,
          orderIndex: op.orderIndex,
        });
        createdDays.set(op.dayKey, day.id);
        break;
      }

      case 'update-day':
        await api.patch(`/days/${op.id}`, {
          ...(op.dayLabel !== undefined && { dayLabel: op.dayLabel }),
          ...(op.orderIndex !== undefined && { orderIndex: op.orderIndex }),
        });
        break;

      case 'create-exercise': {
        const dayId = op.dayId ?? createdDays.get(op.dayKey);
        if (!dayId) throw new Error(`اليوم غير محفوظ بعد: ${op.dayKey}`);
        await api.post(`/days/${dayId}/exercises`, op.payload);
        break;
      }

      case 'update-exercise':
        await api.patch(`/exercises/${op.id}`, op.payload);
        break;
    }
  }
}

function requireProgram(id: string | null): string {
  if (!id) throw new Error('لم يتم إنشاء البرنامج بعد');
  return id;
}

/** Exposed for the unsaved-changes badge. */
export type { ProgramOp };
