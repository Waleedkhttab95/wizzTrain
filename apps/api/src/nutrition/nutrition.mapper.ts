import type { NutritionPlanView } from '@wizzapp/shared';
import type { NutritionPlanRow } from './nutrition.select';

export function toNutritionPlanView(row: NutritionPlanRow): NutritionPlanView {
  return {
    id: row.id,
    dailyCalories: row.dailyCalories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    fiberMinG: row.fiberMinG,
    waterMinL: row.waterMinL,
    stepsMin: row.stepsMin,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    meals: row.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
    })),
  };
}
