import { Prisma } from '@prisma/client';

export const dailyLogSelect = {
  id: true,
  logDate: true,
  weightKg: true,
  caloriesActual: true,
  carbsGActual: true,
  proteinGActual: true,
  fatGActual: true,
  fiberGActual: true,
  waterLActual: true,
  sleepHours: true,
  stepsActual: true,
  notes: true,
} satisfies Prisma.DailyLogSelect;

export type DailyLogRow = Prisma.DailyLogGetPayload<{ select: typeof dailyLogSelect }>;
