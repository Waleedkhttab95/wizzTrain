import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthenticatedUser,
  ExerciseLogView,
  WorkoutDayView,
  WorkoutProgramView,
} from '@wizzapp/shared';
import { ClientAccessService } from '../clients/client-access.service';
import { CreateExerciseItemDto } from './dto/create-exercise-item.dto';
import { CreateExerciseLogDto } from './dto/create-exercise-log.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateWorkoutDayDto } from './dto/create-workout-day.dto';
import { UpdateExerciseItemDto } from './dto/update-exercise-item.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { UpdateWorkoutDayDto } from './dto/update-workout-day.dto';
import { toExerciseVideo, toWorkoutProgramView } from './programs.mapper';
import { ProgramsRepository } from './programs.repository';
import { TemplatesService } from '../templates/templates.service';
import { VideoStorageService } from './video-storage.service';

type ExerciseView = Omit<WorkoutDayView['exercises'][number], 'logs'>;

@Injectable()
export class ProgramsService {
  constructor(
    private readonly programs: ProgramsRepository,
    private readonly access: ClientAccessService,
    private readonly videos: VideoStorageService,
    private readonly templates: TemplatesService,
  ) {}

  /** Bound once so every mapper call resolves upload filenames the same way. */
  private readonly fileUrl = (filename: string) => this.videos.toUrl(filename);

  // ── Programs ───────────────────────────────────────────────────────────

  async createForClient(
    user: AuthenticatedUser,
    clientId: string,
    dto: CreateProgramDto,
  ): Promise<WorkoutProgramView> {
    await this.access.assertCanAccess(user, clientId);

    const meta = { title: dto.title, startDate: new Date(dto.startDate) };

    // Starting from a template copies its content in — the programme is then
    // the client's own, and editing it never touches the template.
    if (dto.templateId) {
      const template = await this.templates.getOwnedOrThrow(user.id, dto.templateId);

      const days = await Promise.all(
        template.days.map(async (day) => ({
          dayLabel: day.dayLabel,
          exercises: await Promise.all(
            day.exercises.map(async (exercise) => ({
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              restInterval: exercise.restInterval,
              notes: exercise.notes,
              videoUrl: exercise.videoUrl,
              // The file is duplicated so the two lifecycles stay independent.
              videoFile: await this.videos.copy(exercise.videoFile),
            })),
          ),
        })),
      );

      const created = await this.programs.createActiveFromTemplate(clientId, meta, days);
      return toWorkoutProgramView(created, this.fileUrl);
    }

    const row = await this.programs.createActive(clientId, meta);
    return toWorkoutProgramView(row, this.fileUrl);
  }

  async listForClient(user: AuthenticatedUser, clientId: string): Promise<WorkoutProgramView[]> {
    await this.access.assertCanAccess(user, clientId);
    const rows = await this.programs.findAllForClient(clientId);
    return rows.map((row) => toWorkoutProgramView(row, this.fileUrl));
  }

  /** `GET /programs/active` — the caller is always a client (spec §9). */
  async getActiveForClient(clientId: string): Promise<WorkoutProgramView> {
    const row = await this.programs.findActiveForClient(clientId);
    if (!row) {
      throw new NotFoundException('لا يوجد برنامج تدريبي مُفعّل حاليًا');
    }
    return toWorkoutProgramView(row, this.fileUrl);
  }

  async getById(user: AuthenticatedUser, programId: string): Promise<WorkoutProgramView> {
    await this.assertProgramAccess(user, programId);
    const row = await this.programs.findById(programId);
    if (!row) {
      throw new NotFoundException('البرنامج غير موجود');
    }
    return toWorkoutProgramView(row, this.fileUrl);
  }

  async updateProgram(
    user: AuthenticatedUser,
    programId: string,
    dto: UpdateProgramDto,
  ): Promise<WorkoutProgramView> {
    await this.assertProgramAccess(user, programId);
    const row = await this.programs.updateProgram(programId, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return toWorkoutProgramView(row, this.fileUrl);
  }

  async deleteProgram(user: AuthenticatedUser, programId: string): Promise<void> {
    await this.assertProgramAccess(user, programId);
    await this.programs.deleteProgram(programId);
  }

  // ── Days ───────────────────────────────────────────────────────────────

  async addDay(
    user: AuthenticatedUser,
    programId: string,
    dto: CreateWorkoutDayDto,
  ): Promise<Omit<WorkoutDayView, 'exercises'>> {
    await this.assertProgramAccess(user, programId);
    const orderIndex = dto.orderIndex ?? (await this.programs.nextDayOrderIndex(programId));
    return this.programs.createDay(programId, { dayLabel: dto.dayLabel, orderIndex });
  }

  async updateDay(
    user: AuthenticatedUser,
    dayId: string,
    dto: UpdateWorkoutDayDto,
  ): Promise<Omit<WorkoutDayView, 'exercises'>> {
    await this.assertDayAccess(user, dayId);
    return this.programs.updateDay(dayId, {
      ...(dto.dayLabel !== undefined && { dayLabel: dto.dayLabel }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
    });
  }

  async deleteDay(user: AuthenticatedUser, dayId: string): Promise<void> {
    await this.assertDayAccess(user, dayId);
    await this.programs.deleteDay(dayId);
  }

  // ── Exercises ──────────────────────────────────────────────────────────

  async addExercise(
    user: AuthenticatedUser,
    dayId: string,
    dto: CreateExerciseItemDto,
  ): Promise<ExerciseView> {
    await this.assertDayAccess(user, dayId);
    const orderIndex = dto.orderIndex ?? (await this.programs.nextExerciseOrderIndex(dayId));
    const row = await this.programs.createExercise(dayId, {
      name: dto.name,
      sets: dto.sets,
      reps: dto.reps,
      restInterval: dto.restInterval ?? null,
      notes: dto.notes ?? null,
      videoUrl: dto.videoUrl ?? null,
      orderIndex,
    });
    return this.withVideo(row);
  }

  async updateExercise(
    user: AuthenticatedUser,
    exerciseId: string,
    dto: UpdateExerciseItemDto,
  ): Promise<ExerciseView> {
    await this.assertExerciseAccess(user, exerciseId);

    // Setting a link removes any uploaded file, so the two never disagree.
    if (dto.videoUrl) {
      const current = await this.programs.findExerciseVideo(exerciseId);
      await this.videos.remove(current?.videoFile ?? null);
    }

    const row = await this.programs.updateExercise(exerciseId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.sets !== undefined && { sets: dto.sets }),
      ...(dto.reps !== undefined && { reps: dto.reps }),
      ...(dto.restInterval !== undefined && { restInterval: dto.restInterval }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl || null, videoFile: null }),
    });
    return this.withVideo(row);
  }

  // ── Exercise video ─────────────────────────────────────────────────────

  /** `POST /exercises/:id/video` — replaces whatever was attached before. */
  async attachVideo(
    user: AuthenticatedUser,
    exerciseId: string,
    file: Express.Multer.File,
  ): Promise<ExerciseView> {
    await this.assertExerciseAccess(user, exerciseId);

    const current = await this.programs.findExerciseVideo(exerciseId);
    const filename = await this.videos.save(file);

    const row = await this.programs.updateExercise(exerciseId, {
      videoFile: filename,
      videoUrl: null,
    });

    // Only bin the old file once the new one is safely recorded.
    await this.videos.remove(current?.videoFile ?? null);

    return this.withVideo(row);
  }

  async removeVideo(user: AuthenticatedUser, exerciseId: string): Promise<ExerciseView> {
    await this.assertExerciseAccess(user, exerciseId);

    const current = await this.programs.findExerciseVideo(exerciseId);
    const row = await this.programs.updateExercise(exerciseId, {
      videoFile: null,
      videoUrl: null,
    });
    await this.videos.remove(current?.videoFile ?? null);

    return this.withVideo(row);
  }

  private withVideo(row: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    restInterval: string | null;
    notes: string | null;
    orderIndex: number;
    videoUrl: string | null;
    videoFile: string | null;
  }): ExerciseView {
    return {
      id: row.id,
      name: row.name,
      sets: row.sets,
      reps: row.reps,
      restInterval: row.restInterval,
      notes: row.notes,
      orderIndex: row.orderIndex,
      video: toExerciseVideo(row.videoUrl, row.videoFile, this.fileUrl),
    };
  }

  async deleteExercise(user: AuthenticatedUser, exerciseId: string): Promise<void> {
    await this.assertExerciseAccess(user, exerciseId);
    await this.programs.deleteExercise(exerciseId);
  }

  // ── Exercise logs ──────────────────────────────────────────────────────

  /** `POST /exercises/:id/logs` — the client records what they actually did. */
  async logExercise(
    user: AuthenticatedUser,
    exerciseId: string,
    dto: CreateExerciseLogDto,
  ): Promise<ExerciseLogView> {
    await this.assertExerciseAccess(user, exerciseId);
    const row = await this.programs.createLog(exerciseId, {
      actualWeightKg: dto.actualWeightKg ?? null,
      actualReps: dto.actualReps ?? null,
      ...(dto.completedAt && { completedAt: new Date(dto.completedAt) }),
    });
    return { ...row, completedAt: row.completedAt.toISOString() };
  }

  async deleteLog(user: AuthenticatedUser, logId: string): Promise<void> {
    const owner = await this.programs.findLogOwner(logId);
    if (!owner) {
      throw new NotFoundException('السجل غير موجود');
    }
    await this.access.assertCanAccess(user, owner.clientId);
    await this.programs.deleteLog(logId);
  }

  // ── Authorisation helpers ──────────────────────────────────────────────
  //
  // Each resource is authorised by resolving it to its owning client and then
  // applying the single rule in ClientAccessService, so trainers can only touch
  // their own clients' programs and a client can only touch their own.

  private async assertProgramAccess(user: AuthenticatedUser, programId: string): Promise<void> {
    const owner = await this.programs.findProgramOwner(programId);
    if (!owner) {
      throw new NotFoundException('البرنامج غير موجود');
    }
    await this.access.assertCanAccess(user, owner.clientId);
  }

  private async assertDayAccess(user: AuthenticatedUser, dayId: string): Promise<void> {
    const owner = await this.programs.findDayOwner(dayId);
    if (!owner) {
      throw new NotFoundException('اليوم التدريبي غير موجود');
    }
    await this.access.assertCanAccess(user, owner.clientId);
  }

  private async assertExerciseAccess(user: AuthenticatedUser, exerciseId: string): Promise<void> {
    const owner = await this.programs.findExerciseOwner(exerciseId);
    if (!owner) {
      throw new NotFoundException('التمرين غير موجود');
    }
    await this.access.assertCanAccess(user, owner.clientId);
  }
}
