import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateWorkoutDayDto {
  @IsString({ message: 'اسم اليوم مطلوب' })
  @MinLength(1, { message: 'اسم اليوم مطلوب' })
  @MaxLength(80, { message: 'اسم اليوم طويل جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  dayLabel!: string;

  /** Optional: defaults to the end of the current day list. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ترتيب اليوم يجب أن يكون رقمًا صحيحًا' })
  @Min(0, { message: 'ترتيب اليوم غير صالح' })
  @Max(1000, { message: 'ترتيب اليوم غير صالح' })
  orderIndex?: number;
}
