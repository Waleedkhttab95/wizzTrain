import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNutritionPlanDto } from './create-nutrition-plan.dto';

/** Supplying `meals` replaces the plan's meal list wholesale; omitting it leaves it untouched. */
export class UpdateNutritionPlanDto extends PartialType(CreateNutritionPlanDto) {
  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون صح أو خطأ' })
  isActive?: boolean;
}
