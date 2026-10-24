import { Prisma } from '@prisma/client';

/**
 * The full active-program tree: days → exercises → logs, ordered for display.
 * Defined once and reused by ProgramsRepository and the client profile query
 * so both return an identically shaped object.
 */
export const workoutProgramSelect = {
  id: true,
  title: true,
  startDate: true,
  isActive: true,
  createdAt: true,
  days: {
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      dayLabel: true,
      orderIndex: true,
      exercises: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          name: true,
          sets: true,
          reps: true,
          restInterval: true,
          notes: true,
          videoUrl: true,
          videoFile: true,
          orderIndex: true,
          logs: {
            orderBy: { completedAt: 'desc' },
            // A single fetch bounded per exercise — avoids the N+1 that a
            // per-exercise "latest logs" query would create.
            take: 10,
            select: {
              id: true,
              completedAt: true,
              actualWeightKg: true,
              actualReps: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WorkoutProgramSelect;

export type WorkoutProgramRow = Prisma.WorkoutProgramGetPayload<{
  select: typeof workoutProgramSelect;
}>;
