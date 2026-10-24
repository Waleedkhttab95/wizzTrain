import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { workoutProgramSelect, type WorkoutProgramRow } from './programs.select';

/** Just enough of the ownership chain to authorise a request. */
export interface OwnerRef {
  clientId: string;
}

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Programs ───────────────────────────────────────────────────────────

  findActiveForClient(clientId: string): Promise<WorkoutProgramRow | null> {
    return this.prisma.workoutProgram.findFirst({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: workoutProgramSelect,
    });
  }

  findAllForClient(clientId: string): Promise<WorkoutProgramRow[]> {
    return this.prisma.workoutProgram.findMany({
      where: { clientId },
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      select: workoutProgramSelect,
    });
  }

  findById(id: string): Promise<WorkoutProgramRow | null> {
    return this.prisma.workoutProgram.findUnique({ where: { id }, select: workoutProgramSelect });
  }

  /**
   * Creates a program and, because `GET /programs/active` must resolve to
   * exactly one, retires the client's previous active programs in the same
   * transaction — so a failure can never leave two programs active at once.
   */
  async createActive(
    clientId: string,
    data: { title: string; startDate: Date },
  ): Promise<WorkoutProgramRow> {
    return this.prisma.$transaction(async (tx) => {
      await tx.workoutProgram.updateMany({
        where: { clientId, isActive: true },
        data: { isActive: false },
      });

      return tx.workoutProgram.create({
        data: { clientId, title: data.title, startDate: data.startDate, isActive: true },
        select: workoutProgramSelect,
      });
    });
  }

  /**
   * Creates a programme with its days and exercises already populated, used
   * when applying a template. One transaction, so a client never ends up with
   * a half-copied programme.
   */
  async createActiveFromTemplate(
    clientId: string,
    data: { title: string; startDate: Date },
    days: {
      dayLabel: string;
      exercises: Omit<Prisma.ExerciseItemUncheckedCreateInput, 'workoutDayId' | 'id'>[];
    }[],
  ): Promise<WorkoutProgramRow> {
    return this.prisma.$transaction(async (tx) => {
      await tx.workoutProgram.updateMany({
        where: { clientId, isActive: true },
        data: { isActive: false },
      });

      return tx.workoutProgram.create({
        data: {
          clientId,
          title: data.title,
          startDate: data.startDate,
          isActive: true,
          days: {
            create: days.map((day, dayIndex) => ({
              dayLabel: day.dayLabel,
              orderIndex: dayIndex,
              exercises: {
                create: day.exercises.map((exercise, index) => ({
                  ...exercise,
                  orderIndex: index,
                })),
              },
            })),
          },
        },
        select: workoutProgramSelect,
      });
    });
  }

  updateProgram(id: string, data: Prisma.WorkoutProgramUpdateInput): Promise<WorkoutProgramRow> {
    return this.prisma.workoutProgram.update({ where: { id }, data, select: workoutProgramSelect });
  }

  async deleteProgram(id: string): Promise<void> {
    await this.prisma.workoutProgram.delete({ where: { id } });
  }

  findProgramOwner(id: string): Promise<OwnerRef | null> {
    return this.prisma.workoutProgram.findUnique({ where: { id }, select: { clientId: true } });
  }

  // ── Days ───────────────────────────────────────────────────────────────

  createDay(programId: string, data: { dayLabel: string; orderIndex: number }) {
    return this.prisma.workoutDay.create({
      data: { programId, ...data },
      select: { id: true, dayLabel: true, orderIndex: true },
    });
  }

  updateDay(id: string, data: Prisma.WorkoutDayUpdateInput) {
    return this.prisma.workoutDay.update({
      where: { id },
      data,
      select: { id: true, dayLabel: true, orderIndex: true },
    });
  }

  async deleteDay(id: string): Promise<void> {
    await this.prisma.workoutDay.delete({ where: { id } });
  }

  async findDayOwner(id: string): Promise<OwnerRef | null> {
    const row = await this.prisma.workoutDay.findUnique({
      where: { id },
      select: { program: { select: { clientId: true } } },
    });
    return row ? { clientId: row.program.clientId } : null;
  }

  /** Next free slot, so the trainer never has to supply orderIndex by hand. */
  async nextDayOrderIndex(programId: string): Promise<number> {
    const last = await this.prisma.workoutDay.findFirst({
      where: { programId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    return last ? last.orderIndex + 1 : 0;
  }

  // ── Exercises ──────────────────────────────────────────────────────────

  createExercise(
    workoutDayId: string,
    data: Omit<Prisma.ExerciseItemUncheckedCreateInput, 'workoutDayId'>,
  ) {
    return this.prisma.exerciseItem.create({
      data: { workoutDayId, ...data },
      select: exerciseFields,
    });
  }

  updateExercise(id: string, data: Prisma.ExerciseItemUpdateInput) {
    return this.prisma.exerciseItem.update({ where: { id }, data, select: exerciseFields });
  }

  async deleteExercise(id: string): Promise<void> {
    await this.prisma.exerciseItem.delete({ where: { id } });
  }

  /** The video currently attached, so an old upload can be cleaned up. */
  findExerciseVideo(id: string): Promise<{ videoFile: string | null } | null> {
    return this.prisma.exerciseItem.findUnique({
      where: { id },
      select: { videoFile: true },
    });
  }

  async findExerciseOwner(id: string): Promise<OwnerRef | null> {
    const row = await this.prisma.exerciseItem.findUnique({
      where: { id },
      select: { workoutDay: { select: { program: { select: { clientId: true } } } } },
    });
    return row ? { clientId: row.workoutDay.program.clientId } : null;
  }

  async nextExerciseOrderIndex(workoutDayId: string): Promise<number> {
    const last = await this.prisma.exerciseItem.findFirst({
      where: { workoutDayId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    return last ? last.orderIndex + 1 : 0;
  }

  // ── Exercise logs ──────────────────────────────────────────────────────

  createLog(
    exerciseItemId: string,
    data: { actualWeightKg?: number | null; actualReps?: string | null; completedAt?: Date },
  ) {
    return this.prisma.exerciseLog.create({
      data: {
        exerciseItemId,
        actualWeightKg: data.actualWeightKg ?? null,
        actualReps: data.actualReps ?? null,
        ...(data.completedAt && { completedAt: data.completedAt }),
      },
      select: { id: true, completedAt: true, actualWeightKg: true, actualReps: true },
    });
  }

  async deleteLog(id: string): Promise<void> {
    await this.prisma.exerciseLog.delete({ where: { id } });
  }

  async findLogOwner(id: string): Promise<OwnerRef | null> {
    const row = await this.prisma.exerciseLog.findUnique({
      where: { id },
      select: {
        exerciseItem: {
          select: { workoutDay: { select: { program: { select: { clientId: true } } } } },
        },
      },
    });
    return row ? { clientId: row.exerciseItem.workoutDay.program.clientId } : null;
  }
}

const exerciseFields = {
  id: true,
  name: true,
  sets: true,
  reps: true,
  restInterval: true,
  notes: true,
  videoUrl: true,
  videoFile: true,
  orderIndex: true,
} satisfies Prisma.ExerciseItemSelect;
