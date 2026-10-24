import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class MealDto {
  @IsString({ message: 'اسم الوجبة مطلوب' })
  @MinLength(1, { message: 'اسم الوجبة مطلوب' })
  @MaxLength(120, { message: 'اسم الوجبة طويل جدًا' })
  @Transform(trim)
  name!: string;

  @IsString({ message: 'وصف الوجبة مطلوب' })
  @MaxLength(2000, { message: 'وصف الوجبة طويل جدًا' })
  @Transform(trim)
  description!: string;
}

export class CreateNutritionPlanDto {
  @Type(() => Number)
  @IsInt({ message: 'السعرات اليومية يجب أن تكون رقمًا صحيحًا' })
  @Min(500, { message: 'السعرات اليومية منخفضة بشكل غير آمن' })
  @Max(10000, { message: 'السعرات اليومية غير منطقية' })
  dailyCalories!: number;

  @Type(() => Number)
  @IsInt({ message: 'البروتين يجب أن يكون رقمًا صحيحًا' })
  @Min(0, { message: 'البروتين لا يمكن أن يكون سالبًا' })
  @Max(1000, { message: 'قيمة البروتين غير منطقية' })
  proteinG!: number;

  @Type(() => Number)
  @IsInt({ message: 'الكربوهيدرات يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الكربوهيدرات لا يمكن أن تكون سالبة' })
  @Max(2000, { message: 'قيمة الكربوهيدرات غير منطقية' })
  carbsG!: number;

  @Type(() => Number)
  @IsInt({ message: 'الدهون يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الدهون لا يمكن أن تكون سالبة' })
  @Max(1000, { message: 'قيمة الدهون غير منطقية' })
  fatG!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الألياف يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الألياف لا يمكن أن تكون سالبة' })
  @Max(300, { message: 'قيمة الألياف غير منطقية' })
  fiberMinG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'الماء يجب أن يكون رقمًا' })
  @Min(0, { message: 'كمية الماء لا يمكن أن تكون سالبة' })
  @Max(20, { message: 'كمية الماء غير منطقية' })
  waterMinL?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الخطوات يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الخطوات لا يمكن أن تكون سالبة' })
  @Max(100000, { message: 'عدد الخطوات غير منطقي' })
  stepsMin?: number;

  @IsOptional()
  @IsArray({ message: 'الوجبات يجب أن تكون قائمة' })
  @ArrayMaxSize(20, { message: 'عدد الوجبات كبير جدًا' })
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals?: MealDto[];
}
