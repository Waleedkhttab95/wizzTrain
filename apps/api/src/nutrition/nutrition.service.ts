import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser, NutritionPlanView } from '@wizzapp/shared';
import { ClientAccessService } from '../clients/client-access.service';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { toNutritionPlanView } from './nutrition.mapper';
import { NutritionRepository } from './nutrition.repository';

@Injectable()
export class NutritionService {
  constructor(
    private readonly plans: NutritionRepository,
    private readonly access: ClientAccessService,
  ) {}

  async createForClient(
    user: AuthenticatedUser,
    clientId: string,
    dto: CreateNutritionPlanDto,
  ): Promise<NutritionPlanView> {
    await this.access.assertCanAccess(user, clientId);

    const row = await this.plans.createActive(
      clientId,
      {
        dailyCalories: dto.dailyCalories,
        proteinG: dto.proteinG,
        carbsG: dto.carbsG,
        fatG: dto.fatG,
        fiberMinG: dto.fiberMinG ?? null,
        waterMinL: dto.waterMinL ?? null,
        stepsMin: dto.stepsMin ?? null,
      },
      dto.meals ?? [],
    );

    return toNutritionPlanView(row);
  }

  /** `GET /nutrition-plan/active` — the caller's own plan (spec §F6). */
  async getActiveForClient(clientId: string): Promise<NutritionPlanView> {
    const row = await this.plans.findActiveForClient(clientId);
    if (!row) {
      throw new NotFoundException('لا توجد خطة غذائية مُفعّلة حاليًا');
    }
    return toNutritionPlanView(row);
  }

  /** The trainer's read of a specific client's plan. */
  async getForClient(user: AuthenticatedUser, clientId: string): Promise<NutritionPlanView> {
    await this.access.assertCanAccess(user, clientId);
    return this.getActiveForClient(clientId);
  }

  async update(
    user: AuthenticatedUser,
    planId: string,
    dto: UpdateNutritionPlanDto,
  ): Promise<NutritionPlanView> {
    const owner = await this.plans.findOwner(planId);
    if (!owner) {
      throw new NotFoundException('الخطة الغذائية غير موجودة');
    }
    await this.access.assertCanAccess(user, owner.clientId);

    const row = await this.plans.update(
      planId,
      {
        ...(dto.dailyCalories !== undefined && { dailyCalories: dto.dailyCalories }),
        ...(dto.proteinG !== undefined && { proteinG: dto.proteinG }),
        ...(dto.carbsG !== undefined && { carbsG: dto.carbsG }),
        ...(dto.fatG !== undefined && { fatG: dto.fatG }),
        ...(dto.fiberMinG !== undefined && { fiberMinG: dto.fiberMinG }),
        ...(dto.waterMinL !== undefined && { waterMinL: dto.waterMinL }),
        ...(dto.stepsMin !== undefined && { stepsMin: dto.stepsMin }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      dto.meals,
    );

    return toNutritionPlanView(row);
  }
}
