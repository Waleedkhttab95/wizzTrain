import { Prisma } from '@prisma/client';

export const nutritionPlanSelect = {
  id: true,
  dailyCalories: true,
  proteinG: true,
  carbsG: true,
  fatG: true,
  fiberMinG: true,
  waterMinL: true,
  stepsMin: true,
  isActive: true,
  createdAt: true,
  meals: {
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true },
  },
} satisfies Prisma.NutritionPlanSelect;

export type NutritionPlanRow = Prisma.NutritionPlanGetPayload<{
  select: typeof nutritionPlanSelect;
}>;
