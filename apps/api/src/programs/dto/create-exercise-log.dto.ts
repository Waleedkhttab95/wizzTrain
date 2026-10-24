import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateExerciseLogDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'الوزن يجب أن يكون رقمًا' })
  @Min(0, { message: 'الوزن لا يمكن أن يكون سالبًا' })
  @Max(1000, { message: 'الوزن غير منطقي' })
  actualWeightKg?: number;

  /** e.g. "10/9/9" — one entry per set (spec §F5). */
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'التكرارات المسجلة طويلة جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  actualReps?: string;

  /** Defaults to now; lets a client backfill a session they forgot to log. */
  @IsOptional()
  @IsDateString({}, { message: 'تاريخ التنفيذ غير صالح' })
  completedAt?: string;
}
