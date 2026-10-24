import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ClientProfile, ClientSelfView, ClientSummary } from '@wizzapp/shared';
import { PasswordService } from '../auth/password.service';
import { VideoStorageService } from '../programs/video-storage.service';
import { toDailyLogView } from '../daily-logs/daily-logs.mapper';
import { toNutritionPlanView } from '../nutrition/nutrition.mapper';
import { toWorkoutProgramView } from '../programs/programs.mapper';
import { toIsoDate } from '../common/utils/date.util';
import {
  ClientsRepository,
  type ClientProfileRow,
  type ClientSummaryRow,
} from './clients.repository';
import { summariseAdherence } from './adherence';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clients: ClientsRepository,
    private readonly passwords: PasswordService,
    private readonly videos: VideoStorageService,
  ) {}

  private readonly fileUrl = (filename: string) => this.videos.toUrl(filename);

  async list(trainerId: string): Promise<ClientSummary[]> {
    const rows = await this.clients.findAllForTrainer(trainerId);
    return rows.map(toClientSummary);
  }

  async create(trainerId: string, dto: CreateClientDto): Promise<ClientProfile> {
    if (await this.clients.isEmailTaken(dto.email)) {
      throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    }

    const row = await this.clients.create({
      trainerId,
      name: dto.name,
      email: dto.email,
      passwordHash: await this.passwords.hash(dto.password),
      heightCm: dto.heightCm ?? null,
      age: dto.age ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      phone: dto.phone ?? null,
      startWeightKg: dto.startWeightKg ?? null,
      goalWeightKg: dto.goalWeightKg ?? null,
      goalNote: dto.goalNote ?? null,
    });

    return { ...toClientSummary(row), ...emptyRelations(row) };
  }

  /**
   * Issues a client a new password. Trainer-only, and scoped the same way as
   * every other client route, so a trainer cannot reset an account they do
   * not own. The client's existing tokens keep working until they expire —
   * the JWT carries no password state — so this locks nobody out mid-session.
   */
  async resetPassword(trainerId: string, id: string, password: string): Promise<void> {
    await this.getOwnedOrThrow(id, trainerId);
    await this.clients.update(id, { passwordHash: await this.passwords.hash(password) });
  }

  async update(trainerId: string, id: string, dto: UpdateClientDto): Promise<ClientProfile> {
    await this.getOwnedOrThrow(id, trainerId);

    await this.clients.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
      ...(dto.age !== undefined && { age: dto.age }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.startWeightKg !== undefined && { startWeightKg: dto.startWeightKg }),
      ...(dto.goalWeightKg !== undefined && { goalWeightKg: dto.goalWeightKg }),
      ...(dto.goalNote !== undefined && { goalNote: dto.goalNote }),
    });

    return this.getProfile(id, trainerId);
  }

  /**
   * The trainer's client detail view: personal data, the active program, the
   * active nutrition plan and the most recent daily log — one round trip.
   */
  async getProfile(id: string, trainerId: string): Promise<ClientProfile> {
    const row = await this.clients.findProfileWithRelations(id, trainerId);
    if (!row) {
      throw new NotFoundException('المتدرب غير موجود');
    }

    const [activeProgram] = row.workoutPrograms;
    const [activePlan] = row.nutritionPlans;
    const [latestLog] = row.dailyLogs;

    return {
      ...toClientSummary(row),
      heightCm: row.heightCm,
      age: row.age,
      goalNote: row.goalNote,
      activeProgram: activeProgram ? toWorkoutProgramView(activeProgram, this.fileUrl) : null,
      activeNutritionPlan: activePlan ? toNutritionPlanView(activePlan) : null,
      latestDailyLog: latestLog ? toDailyLogView(latestLog) : null,
    };
  }

  /** `GET /me` — what a client is allowed to see about themselves. */
  async getSelf(clientId: string): Promise<ClientSelfView> {
    const row = await this.clients.findSelf(clientId);
    if (!row) {
      throw new NotFoundException('الحساب غير موجود');
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      heightCm: row.heightCm,
      age: row.age,
      startDate: row.startDate ? toIsoDate(row.startDate) : null,
      startWeightKg: row.startWeightKg,
      goalWeightKg: row.goalWeightKg,
      goalNote: row.goalNote,
      trainerName: row.trainer.name,
    };
  }

  private async getOwnedOrThrow(id: string, trainerId: string): Promise<ClientProfileRow> {
    const row = await this.clients.findByIdForTrainer(id, trainerId);
    if (!row) {
      throw new NotFoundException('المتدرب غير موجود');
    }
    return row;
  }
}

function toClientSummary(row: ClientSummaryRow): ClientSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    goalWeightKg: row.goalWeightKg,
    startWeightKg: row.startWeightKg,
    startDate: row.startDate ? toIsoDate(row.startDate) : null,
    createdAt: row.createdAt.toISOString(),
    ...summariseAdherence(row.dailyLogs),
  };
}

function emptyRelations(row: ClientProfileRow) {
  return {
    heightCm: row.heightCm,
    age: row.age,
    goalNote: row.goalNote,
    activeProgram: null,
    activeNutritionPlan: null,
    latestDailyLog: null,
  };
}
