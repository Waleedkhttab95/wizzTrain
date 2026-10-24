import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProgramTemplateSummary, ProgramTemplateView } from '@wizzapp/shared';
import { VideoStorageService } from '../programs/video-storage.service';
import { SaveTemplateDto } from './dto/save-template.dto';
import { toTemplateSummary, toTemplateView } from './templates.mapper';
import { TemplatesRepository, type TemplateDayInput } from './templates.repository';
import type { TemplateRow } from './templates.select';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templates: TemplatesRepository,
    private readonly videos: VideoStorageService,
  ) {}

  private readonly fileUrl = (filename: string) => this.videos.toUrl(filename);

  async list(trainerId: string): Promise<ProgramTemplateSummary[]> {
    const rows = await this.templates.findAllForTrainer(trainerId);
    return rows.map(toTemplateSummary);
  }

  async get(trainerId: string, id: string): Promise<ProgramTemplateView> {
    return toTemplateView(await this.getOwnedOrThrow(trainerId, id), this.fileUrl);
  }

  async create(trainerId: string, dto: SaveTemplateDto): Promise<ProgramTemplateView> {
    const row = await this.templates.create(trainerId, this.toInput(dto));
    return toTemplateView(row, this.fileUrl);
  }

  /**
   * Replaces the template wholesale.
   *
   * Uploaded videos are preserved by filename: the editor round-trips whatever
   * the exercise already had, and anything no longer referenced is deleted
   * from disk so files don't accumulate.
   */
  async replace(trainerId: string, id: string, dto: SaveTemplateDto): Promise<ProgramTemplateView> {
    const before = await this.getOwnedOrThrow(trainerId, id);
    const keptFiles = new Set(
      (dto.days ?? [])
        .flatMap((day) => day.exercises ?? [])
        .map((exercise) => (exercise as { videoFile?: string }).videoFile)
        .filter((file): file is string => Boolean(file)),
    );

    const row = await this.templates.replace(id, this.toInput(dto, before));

    const orphaned = before.days
      .flatMap((day) => day.exercises)
      .map((exercise) => exercise.videoFile)
      .filter((file): file is string => Boolean(file) && !keptFiles.has(file as string));

    await Promise.all(orphaned.map((file) => this.videos.remove(file)));

    return toTemplateView(row, this.fileUrl);
  }

  async remove(trainerId: string, id: string): Promise<void> {
    await this.getOwnedOrThrow(trainerId, id);

    // Collect the files before the rows go, or there is nothing left to read.
    const files = await this.templates.findVideoFiles(id);
    await this.templates.delete(id);
    await Promise.all(files.map((file) => this.videos.remove(file)));
  }

  /** Loaded for the apply-to-client copy in ProgramsService. */
  getOwnedOrThrow(trainerId: string, id: string): Promise<TemplateRow> {
    return this.templates.findByIdForTrainer(id, trainerId).then((row) => {
      if (!row) throw new NotFoundException('الجدول غير موجود');
      return row;
    });
  }

  /**
   * DTO → rows.
   *
   * `previous` lets an edit keep an uploaded video that the editor sent back by
   * name; without it every save would silently strip uploads, since the DTO
   * only carries links.
   */
  private toInput(
    dto: SaveTemplateDto,
    previous?: TemplateRow,
  ): {
    title: string;
    notes: string | null;
    days: TemplateDayInput[];
  } {
    const filesByName = new Map<string, string>();
    for (const day of previous?.days ?? []) {
      for (const exercise of day.exercises) {
        if (exercise.videoFile)
          filesByName.set(`${day.dayLabel}::${exercise.name}`, exercise.videoFile);
      }
    }

    return {
      title: dto.title,
      notes: dto.notes?.trim() || null,
      days: (dto.days ?? []).map((day) => ({
        dayLabel: day.dayLabel,
        exercises: (day.exercises ?? [])
          .filter((exercise) => exercise.name.trim() !== '')
          .map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restInterval: exercise.restInterval?.trim() || null,
            notes: exercise.notes?.trim() || null,
            videoUrl: exercise.videoUrl?.trim() || null,
            videoFile: exercise.videoUrl?.trim()
              ? null
              : (filesByName.get(`${day.dayLabel}::${exercise.name}`) ?? null),
          })),
      })),
    };
  }
}
