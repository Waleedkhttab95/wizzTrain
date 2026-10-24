import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AdherenceCounts, DayActivity } from './weekly-summary.calculator';

@Injectable()
export class SummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveProgram(clientId: string): Promise<{ id: string; startDate: Date } | null> {
    return this.prisma.workoutProgram.findFirst({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, startDate: true },
    });
  }

  /**
   * Workout adherence for one week (spec §F8).
   *
   * `planned` is one pass through the active program — the trainer's weekly
   * cycle. `logged` counts *distinct* exercises that have at least one log in
   * the window, so a client who records three sets of the same exercise
   * separately counts once, not three times.
   *
   * Both sides are COUNT queries served by the `workoutDayId` and
   * `exerciseItemId, completedAt` indexes; nothing is loaded into memory.
   */
  async countAdherence(programId: string, from: Date, toExclusive: Date): Promise<AdherenceCounts> {
    const inProgram = { workoutDay: { programId } };

    const [planned, logged] = await this.prisma.$transaction([
      this.prisma.exerciseItem.count({ where: inProgram }),
      this.prisma.exerciseItem.count({
        where: {
          ...inProgram,
          logs: { some: { completedAt: { gte: from, lt: toExclusive } } },
        },
      }),
    ]);

    return { planned, logged };
  }

  /**
   * Each training day in the program, in order, flagged with whether any of its
   * exercises was logged during the window.
   *
   * A trainer reads adherence in sessions — "3 of 4 days" — which the exercise
   * counts above cannot express. One query with a nested `some`, not a query
   * per day.
   */
  async findDayActivity(programId: string, from: Date, toExclusive: Date): Promise<DayActivity[]> {
    const days = await this.prisma.workoutDay.findMany({
      where: { programId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        dayLabel: true,
        exercises: {
          where: { logs: { some: { completedAt: { gte: from, lt: toExclusive } } } },
          select: { id: true },
          take: 1,
        },
      },
    });

    return days.map((day) => ({
      id: day.id,
      label: day.dayLabel,
      logged: day.exercises.length > 0,
    }));
  }
}
