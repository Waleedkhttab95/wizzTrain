import type { ProgramTemplateSummary, ProgramTemplateView } from '@wizzapp/shared';
import { toExerciseVideo } from '../programs/programs.mapper';
import type { TemplateRow, TemplateSummaryRow } from './templates.select';

export function toTemplateView(
  row: TemplateRow,
  fileUrl: (filename: string) => string,
): ProgramTemplateView {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    days: row.days.map((day) => ({
      id: day.id,
      dayLabel: day.dayLabel,
      orderIndex: day.orderIndex,
      exercises: day.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restInterval: exercise.restInterval,
        notes: exercise.notes,
        orderIndex: exercise.orderIndex,
        video: toExerciseVideo(exercise.videoUrl, exercise.videoFile, fileUrl),
      })),
    })),
  };
}

export function toTemplateSummary(row: TemplateSummaryRow): ProgramTemplateSummary {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
    dayCount: row.days.length,
    exerciseCount: row.days.reduce((sum, day) => sum + day._count.exercises, 0),
  };
}
