import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { dailyLogSelect } from '../daily-logs/daily-logs.select';
import { nutritionPlanSelect } from '../nutrition/nutrition.select';
import { workoutProgramSelect } from '../programs/programs.select';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Selection shared by every client read. Explicitly listing columns guarantees
 * `passwordHash` can never leak through a response, which a `select: undefined`
 * default would not.
 */
export const clientSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  goalWeightKg: true,
  startWeightKg: true,
  startDate: true,
  createdAt: true,
  /**
   * Enough recent logs to build the roster's week strip and "last logged"
   * line. Ten covers the seven-day window with room to spare, and Prisma
   * fetches them in one joined read rather than a query per client.
   */
  dailyLogs: {
    orderBy: { logDate: 'desc' },
    take: 10,
    select: { logDate: true, weightKg: true },
  },
} satisfies Prisma.ClientSelect;

export const clientProfileSelect = {
  ...clientSummarySelect,
  heightCm: true,
  age: true,
  goalNote: true,
} satisfies Prisma.ClientSelect;

/**
 * The detail view in one query: the client, their single active program, their
 * single active nutrition plan and their newest daily log. Prisma issues this
 * as a bounded set of joined reads rather than one query per relation.
 */
export const clientProfileWithRelationsSelect = {
  ...clientProfileSelect,
  workoutPrograms: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: workoutProgramSelect,
  },
  nutritionPlans: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: nutritionPlanSelect,
  },
  // Ten, not one: the newest is the profile's "latest log", and the rest feed
  // the same seven-day adherence window the roster uses. Taking one here left
  // the profile reporting a week strip built from a single day.
  dailyLogs: {
    orderBy: { logDate: 'desc' },
    take: 10,
    select: dailyLogSelect,
  },
} satisfies Prisma.ClientSelect;

export type ClientSummaryRow = Prisma.ClientGetPayload<{ select: typeof clientSummarySelect }>;
export type ClientProfileRow = Prisma.ClientGetPayload<{ select: typeof clientProfileSelect }>;
export type ClientProfileWithRelationsRow = Prisma.ClientGetPayload<{
  select: typeof clientProfileWithRelationsSelect;
}>;

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForTrainer(trainerId: string): Promise<ClientSummaryRow[]> {
    return this.prisma.client.findMany({
      where: { trainerId },
      select: clientSummarySelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForTrainer(id: string, trainerId: string): Promise<ClientProfileRow | null> {
    return this.prisma.client.findFirst({
      where: { id, trainerId },
      select: clientProfileSelect,
    });
  }

  findProfileWithRelations(
    id: string,
    trainerId: string,
  ): Promise<ClientProfileWithRelationsRow | null> {
    return this.prisma.client.findFirst({
      where: { id, trainerId },
      select: clientProfileWithRelationsSelect,
    });
  }

  /** The client's own profile, with their trainer's name for the coach note. */
  findSelf(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        heightCm: true,
        age: true,
        startDate: true,
        startWeightKg: true,
        goalWeightKg: true,
        goalNote: true,
        trainer: { select: { name: true } },
      },
    });
  }

  findById(id: string): Promise<ClientProfileRow | null> {
    return this.prisma.client.findUnique({ where: { id }, select: clientProfileSelect });
  }

  /** Ownership check used by every trainer-scoped route in other modules. */
  async existsForTrainer(id: string, trainerId: string): Promise<boolean> {
    const found = await this.prisma.client.findFirst({
      where: { id, trainerId },
      select: { id: true },
    });
    return found !== null;
  }

  create(data: Prisma.ClientUncheckedCreateInput): Promise<ClientProfileRow> {
    return this.prisma.client.create({ data, select: clientProfileSelect });
  }

  update(id: string, data: Prisma.ClientUpdateInput): Promise<ClientProfileRow> {
    return this.prisma.client.update({ where: { id }, data, select: clientProfileSelect });
  }

  /** Checks both account tables — emails must be unique across the platform. */
  async isEmailTaken(email: string): Promise<boolean> {
    const [trainer, client] = await Promise.all([
      this.prisma.trainer.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.client.findUnique({ where: { email }, select: { id: true } }),
    ]);
    return trainer !== null || client !== null;
  }
}
