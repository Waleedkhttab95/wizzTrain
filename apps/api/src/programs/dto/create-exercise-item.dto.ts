import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateExerciseItemDto {
  @IsString({ message: 'اسم التمرين مطلوب' })
  @MinLength(2, { message: 'اسم التمرين قصير جدًا' })
  @MaxLength(160, { message: 'اسم التمرين طويل جدًا' })
  @Transform(trim)
  name!: string;

  @Type(() => Number)
  @IsInt({ message: 'عدد المجموعات يجب أن يكون رقمًا صحيحًا' })
  @Min(1, { message: 'عدد المجموعات يجب أن يكون 1 على الأقل' })
  @Max(50, { message: 'عدد المجموعات غير منطقي' })
  sets!: number;

  /** Free-form on purpose: the trainer writes "8-10", "AMRAP", "30 ثانية"… (spec §F3). */
  @IsString({ message: 'عدد التكرارات مطلوب' })
  @MinLength(1, { message: 'عدد التكرارات مطلوب' })
  @MaxLength(60, { message: 'عدد التكرارات طويل جدًا' })
  @Transform(trim)
  reps!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'فترة الراحة طويلة جدًا' })
  @Transform(trim)
  restInterval?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'الملاحظات طويلة جدًا' })
  @Transform(trim)
  notes?: string;

  /**
   * A link to a demonstration video. Uploading a file instead clears this,
   * so an exercise never carries two competing videos.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2048, { message: 'الرابط طويل جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  // An empty string is how the trainer clears the link, so it skips the URL
  // check — everything else must be a real http(s) address.
  @ValidateIf((_, value) => value !== '')
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'رابط الفيديو غير صالح — لازم يبدأ بـ http أو https' },
  )
  videoUrl?: string;

  /** Optional: defaults to the end of the day's exercise list. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ترتيب التمرين يجب أن يكون رقمًا صحيحًا' })
  @Min(0, { message: 'ترتيب التمرين غير صالح' })
  @Max(1000, { message: 'ترتيب التمرين غير صالح' })
  orderIndex?: number;
}
