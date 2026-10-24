import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class TemplateExerciseDto {
  /**
   * A blank name marks a row the trainer added but never filled in. The editor
   * lets those sit there while they work, so the API drops them on save rather
   * than rejecting the whole template over a trailing empty row — matching how
   * the programme builder behaves.
   */
  @IsString({ message: 'اسم التمرين مطلوب' })
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @MinLength(2, { message: 'اسم التمرين قصير جدًا' })
  @MaxLength(160, { message: 'اسم التمرين طويل جدًا' })
  @Transform(trim)
  name!: string;

  @Type(() => Number)
  @IsInt({ message: 'عدد المجموعات يجب أن يكون رقمًا صحيحًا' })
  @Min(1, { message: 'عدد المجموعات يجب أن يكون 1 على الأقل' })
  @Max(50, { message: 'عدد المجموعات غير منطقي' })
  sets!: number;

  @IsString({ message: 'عدد التكرارات مطلوب' })
  @MinLength(1, { message: 'عدد التكرارات مطلوب' })
  @MaxLength(60, { message: 'عدد التكرارات طويل جدًا' })
  @Transform(trim)
  reps!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(trim)
  restInterval?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048, { message: 'الرابط طويل جدًا' })
  @Transform(trim)
  @ValidateIf((_, value) => value !== '')
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'رابط الفيديو غير صالح — لازم يبدأ بـ http أو https' },
  )
  videoUrl?: string;
}

export class TemplateDayDto {
  @IsString({ message: 'اسم اليوم مطلوب' })
  @MinLength(1, { message: 'اسم اليوم مطلوب' })
  @MaxLength(80, { message: 'اسم اليوم طويل جدًا' })
  @Transform(trim)
  dayLabel!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40, { message: 'عدد التمارين في اليوم كبير جدًا' })
  @ValidateNested({ each: true })
  @Type(() => TemplateExerciseDto)
  exercises?: TemplateExerciseDto[];
}

/**
 * The whole template in one body.
 *
 * Templates are small and edited as a unit, so replace-all is simpler than the
 * granular day/exercise routes a client's live programme needs — and it means
 * the editor doesn't have to diff anything.
 */
export class SaveTemplateDto {
  @IsString({ message: 'عنوان الجدول مطلوب' })
  @MinLength(2, { message: 'عنوان الجدول قصير جدًا' })
  @MaxLength(160, { message: 'عنوان الجدول طويل جدًا' })
  @Transform(trim)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'الملاحظات طويلة جدًا' })
  @Transform(trim)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(14, { message: 'عدد الأيام كبير جدًا' })
  @ValidateNested({ each: true })
  @Type(() => TemplateDayDto)
  days?: TemplateDayDto[];
}
