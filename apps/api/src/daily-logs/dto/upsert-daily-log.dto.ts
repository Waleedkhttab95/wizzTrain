import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Every measurement is optional: a client may only know their weight in the
 * morning and fill in macros later the same day. Re-posting the same `logDate`
 * updates the existing record (spec §F7).
 */
export class UpsertDailyLogDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'التاريخ يجب أن يكون بصيغة YYYY-MM-DD' })
  logDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'الوزن يجب أن يكون رقمًا' })
  @Min(20, { message: 'الوزن غير منطقي' })
  @Max(400, { message: 'الوزن غير منطقي' })
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'السعرات يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'السعرات لا يمكن أن تكون سالبة' })
  @Max(20000, { message: 'السعرات غير منطقية' })
  caloriesActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الكربوهيدرات يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الكربوهيدرات لا يمكن أن تكون سالبة' })
  @Max(2000, { message: 'الكربوهيدرات غير منطقية' })
  carbsGActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'البروتين يجب أن يكون رقمًا صحيحًا' })
  @Min(0, { message: 'البروتين لا يمكن أن يكون سالبًا' })
  @Max(1000, { message: 'البروتين غير منطقي' })
  proteinGActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الدهون يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الدهون لا يمكن أن تكون سالبة' })
  @Max(1000, { message: 'الدهون غير منطقية' })
  fatGActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الألياف يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الألياف لا يمكن أن تكون سالبة' })
  @Max(300, { message: 'الألياف غير منطقية' })
  fiberGActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'الماء يجب أن يكون رقمًا' })
  @Min(0, { message: 'كمية الماء لا يمكن أن تكون سالبة' })
  @Max(20, { message: 'كمية الماء غير منطقية' })
  waterLActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'ساعات النوم يجب أن تكون رقمًا' })
  @Min(0, { message: 'ساعات النوم لا يمكن أن تكون سالبة' })
  @Max(24, { message: 'ساعات النوم لا يمكن أن تتجاوز 24' })
  sleepHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الخطوات يجب أن تكون رقمًا صحيحًا' })
  @Min(0, { message: 'الخطوات لا يمكن أن تكون سالبة' })
  @Max(200000, { message: 'عدد الخطوات غير منطقي' })
  stepsActual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'الملاحظات طويلة جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
