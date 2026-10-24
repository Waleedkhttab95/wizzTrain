import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  templateSelect,
  templateSummarySelect,
  type TemplateRow,
  type TemplateSummaryRow,
} from './templates.select';

/** One day's worth of exercises as the save endpoint receives them. */
export interface TemplateDayInput {
  dayLabel: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restInterval: string | null;
    notes: string | null;
    videoUrl: string | null;
    videoFile: string | null;
  }[];
}

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForTrainer(trainerId: string): Promise<TemplateSummaryRow[]> {
    return this.prisma.programTemplate.findMany({
      where: { trainerId },
      orderBy: { updatedAt: 'desc' },
      select: templateSummarySelect,
    });
  }

  findByIdForTrainer(id: string, trainerId: string): Promise<TemplateRow | null> {
    return this.prisma.programTemplate.findFirst({
      where: { id, trainerId },
      select: templateSelect,
    });
  }

  create(
    trainerId: string,
    data: { title: string; notes: string | null; days: TemplateDayInput[] },
  ): Promise<TemplateRow> {
    return this.prisma.programTemplate.create({
      data: {
        trainerId,
        title: data.title,
        notes: data.notes,
        days: { create: this.nestedDays(data.days) },
      },
      select: templateSelect,
    });
  }

  /**
   * Replaces the whole tree in one transaction — dropping the old days and
   * recreating them, so a partial save can never leave a half-edited template.
   * Cheap because templates are small and edited as a unit.
   */
  replace(
    id: string,
    data: { title: string; notes: string | null; days: TemplateDayInput[] },
  ): Promise<TemplateRow> {
    return this.prisma.$transaction(async (tx) => {
      await tx.templateDay.deleteMany({ where: { templateId: id } });

      return tx.programTemplate.update({
        where: { id },
        data: {
          title: data.title,
          notes: data.notes,
          days: { create: this.nestedDays(data.days) },
        },
        select: templateSelect,
      });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.programTemplate.delete({ where: { id } });
  }

  /** Every uploaded video the template references, for cleanup on delete. */
  async findVideoFiles(id: string): Promise<string[]> {
    const rows = await this.prisma.templateExercise.findMany({
      where: { templateDay: { templateId: id }, videoFile: { not: null } },
      select: { videoFile: true },
    });
    return rows.map((row) => row.videoFile as string);
  }

  private nestedDays(days: TemplateDayInput[]) {
    return days.map((day, dayIndex) => ({
      dayLabel: day.dayLabel,
      orderIndex: dayIndex,
      exercises: {
        create: day.exercises.map((exercise, index) => ({ ...exercise, orderIndex: index })),
      },
    }));
  }
}
