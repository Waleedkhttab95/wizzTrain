import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dailyLogSelect, type DailyLogRow } from './daily-logs.select';

/** The subset of columns the weekly aggregation reads. */
export const dailyLogMetricsSelect = {
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
} satisfies Prisma.DailyLogSelect;

export type DailyLogMetricsRow = Prisma.DailyLogGetPayload<{
  select: typeof dailyLogMetricsSelect;
}>;

@Injectable()
export class DailyLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One record per client per date (spec §F7). The `@@unique([clientId, logDate])`
   * constraint makes this upsert atomic — two concurrent submissions for the
   * same day cannot create a duplicate.
   */
  upsert(
    clientId: string,
    logDate: Date,
    values: Omit<Prisma.DailyLogUncheckedCreateInput, 'clientId' | 'logDate' | 'id'>,
  ): Promise<DailyLogRow> {
    return this.prisma.dailyLog.upsert({
      where: { clientId_logDate: { clientId, logDate } },
      create: { clientId, logDate, ...values },
      update: values,
      select: dailyLogSelect,
    });
  }

  findRange(clientId: string, from: Date, toExclusive: Date): Promise<DailyLogRow[]> {
    return this.prisma.dailyLog.findMany({
      where: { clientId, logDate: { gte: from, lt: toExclusive } },
      orderBy: { logDate: 'asc' },
      select: dailyLogSelect,
    });
  }

  findMetricsInRange(
    clientId: string,
    from: Date,
    toExclusive: Date,
  ): Promise<DailyLogMetricsRow[]> {
    return this.prisma.dailyLog.findMany({
      where: { clientId, logDate: { gte: from, lt: toExclusive } },
      orderBy: { logDate: 'asc' },
      select: dailyLogMetricsSelect,
    });
  }

  /**
   * The dates in `[from, toExclusive)` on which this client logged at least one
   * exercise. Answered with a single grouped query rather than one lookup per
   * day, so the trainer's log table stays a two-query page.
   */
  async findWorkoutDates(clientId: string, from: Date, toExclusive: Date): Promise<Set<string>> {
    const rows = await this.prisma.exerciseLog.findMany({
      where: {
        completedAt: { gte: from, lt: toExclusive },
        exerciseItem: { workoutDay: { program: { clientId } } },
      },
      select: { completedAt: true },
    });

    // completedAt is a timestamp; a "workout day" is its UTC calendar date,
    // matching how DailyLog.logDate is stored.
    return new Set(rows.map((row) => row.completedAt.toISOString().slice(0, 10)));
  }

  findByDate(clientId: string, logDate: Date): Promise<DailyLogRow | null> {
    return this.prisma.dailyLog.findUnique({
      where: { clientId_logDate: { clientId, logDate } },
      select: dailyLogSelect,
    });
  }
}
