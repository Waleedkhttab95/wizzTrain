import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { nutritionPlanSelect, type NutritionPlanRow } from './nutrition.select';

export interface NutritionTargets {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberMinG: number | null;
  waterMinL: number | null;
  stepsMin: number | null;
}

@Injectable()
export class NutritionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveForClient(clientId: string): Promise<NutritionPlanRow | null> {
    return this.prisma.nutritionPlan.findFirst({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: nutritionPlanSelect,
    });
  }

  /** Targets only — what the weekly summary needs, without the meal list. */
  findActiveTargets(clientId: string): Promise<NutritionTargets | null> {
    return this.prisma.nutritionPlan.findFirst({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        dailyCalories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        fiberMinG: true,
        waterMinL: true,
        stepsMin: true,
      },
    });
  }

  findById(id: string): Promise<NutritionPlanRow | null> {
    return this.prisma.nutritionPlan.findUnique({ where: { id }, select: nutritionPlanSelect });
  }

  findOwner(id: string): Promise<{ clientId: string } | null> {
    return this.prisma.nutritionPlan.findUnique({ where: { id }, select: { clientId: true } });
  }

  /**
   * A new plan supersedes the old one. Deactivating the previous plans and
   * inserting the new one share a transaction so `GET /nutrition-plan/active`
   * can never see two active plans, even if the insert fails.
   */
  createActive(
    clientId: string,
    targets: NutritionTargets,
    meals: { name: string; description: string }[],
  ): Promise<NutritionPlanRow> {
    return this.prisma.$transaction(async (tx) => {
      await tx.nutritionPlan.updateMany({
        where: { clientId, isActive: true },
        data: { isActive: false },
      });

      return tx.nutritionPlan.create({
        data: {
          clientId,
          ...targets,
          isActive: true,
          ...(meals.length > 0 && { meals: { createMany: { data: meals } } }),
        },
        select: nutritionPlanSelect,
      });
    });
  }

  /** Updating targets and swapping the meal list must not half-apply. */
  update(
    id: string,
    data: Prisma.NutritionPlanUpdateInput,
    meals?: { name: string; description: string }[],
  ): Promise<NutritionPlanRow> {
    return this.prisma.$transaction(async (tx) => {
      if (meals) {
        await tx.meal.deleteMany({ where: { nutritionPlanId: id } });
        if (meals.length > 0) {
          await tx.meal.createMany({
            data: meals.map((meal) => ({ ...meal, nutritionPlanId: id })),
          });
        }
      }

      return tx.nutritionPlan.update({ where: { id }, data, select: nutritionPlanSelect });
    });
  }
}
