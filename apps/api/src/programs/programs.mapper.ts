import type { ExerciseVideo, WorkoutProgramView } from '@wizzapp/shared';
import { toIsoDate } from '../common/utils/date.util';
import type { WorkoutProgramRow } from './programs.select';

/**
 * Resolves the stored pair into a single video the client can open.
 *
 * An uploaded file wins if both are somehow set — but they are kept mutually
 * exclusive on write, so that is a belt-and-braces tiebreak rather than a rule
 * callers need to know.
 */
export function toExerciseVideo(
  videoUrl: string | null,
  videoFile: string | null,
  fileUrl: (filename: string) => string,
): ExerciseVideo | null {
  if (videoFile) return { kind: 'upload', url: fileUrl(videoFile) };
  if (videoUrl) return { kind: 'link', url: videoUrl };
  return null;
}

/** Prisma row → the wire shape shared with the web app. */
export function toWorkoutProgramView(
  row: WorkoutProgramRow,
  fileUrl: (filename: string) => string,
): WorkoutProgramView {
  return {
    id: row.id,
    title: row.title,
    startDate: toIsoDate(row.startDate),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
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
        logs: exercise.logs.map((log) => ({
          id: log.id,
          completedAt: log.completedAt.toISOString(),
          actualWeightKg: log.actualWeightKg,
          actualReps: log.actualReps,
        })),
      })),
    })),
  };
}
