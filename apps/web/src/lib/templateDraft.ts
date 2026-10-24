import type { ProgramTemplateView } from '@wizzapp/shared';

/**
 * The template editor saves the whole thing in one request, so unlike the
 * programme builder there is no diff — the draft simply becomes the body.
 */

export interface DraftExercise {
  key: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  videoUrl: string;
}

export interface DraftDay {
  key: string;
  name: string;
  exercises: DraftExercise[];
}

export interface TemplateDraft {
  title: string;
  notes: string;
  days: DraftDay[];
}

let counter = 0;
const key = (prefix: string) => {
  counter += 1;
  return `${prefix}-${counter}`;
};

export function emptyExercise(): DraftExercise {
  return { key: key('tex'), name: '', sets: '3', reps: '', rest: '', notes: '', videoUrl: '' };
}

export function emptyDay(index: number): DraftDay {
  return { key: key('tday'), name: `يوم ${index + 1}`, exercises: [emptyExercise()] };
}

export function toDraft(template: ProgramTemplateView | null): TemplateDraft {
  if (!template) {
    return { title: '', notes: '', days: [emptyDay(0)] };
  }

  return {
    title: template.title,
    notes: template.notes ?? '',
    days: template.days.map((day) => ({
      key: `tday-${day.id}`,
      name: day.dayLabel,
      exercises: day.exercises.map((exercise) => ({
        key: `tex-${exercise.id}`,
        name: exercise.name,
        sets: String(exercise.sets),
        reps: exercise.reps,
        rest: exercise.restInterval ?? '',
        notes: exercise.notes ?? '',
        // Only a pasted link round-trips; an uploaded file is preserved
        // server-side by name and never surfaces as an editable URL.
        videoUrl: exercise.video?.kind === 'link' ? exercise.video.url : '',
      })),
    })),
  };
}

/** Draft → request body. Blank rows are dropped here as well as server-side. */
export function toPayload(draft: TemplateDraft): Record<string, unknown> {
  return {
    title: draft.title.trim(),
    notes: draft.notes.trim() || undefined,
    days: draft.days.map((day, index) => ({
      dayLabel: day.name.trim() || `يوم ${index + 1}`,
      exercises: day.exercises
        .filter((exercise) => exercise.name.trim() !== '')
        .map((exercise) => {
          const sets = Number.parseInt(exercise.sets, 10);
          return {
            name: exercise.name.trim(),
            sets: Number.isFinite(sets) && sets > 0 ? sets : 1,
            reps: exercise.reps.trim() || '-',
            restInterval: exercise.rest.trim() || undefined,
            notes: exercise.notes.trim() || undefined,
            videoUrl: exercise.videoUrl.trim() || undefined,
          };
        }),
    })),
  };
}

/** How many real exercises the draft holds, for the header count. */
export function exerciseCount(draft: TemplateDraft): number {
  return draft.days.reduce(
    (sum, day) => sum + day.exercises.filter((e) => e.name.trim() !== '').length,
    0,
  );
}
