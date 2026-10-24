import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProgramDto {
  @IsString({ message: 'عنوان البرنامج مطلوب' })
  @MinLength(2, { message: 'عنوان البرنامج قصير جدًا' })
  @MaxLength(160, { message: 'عنوان البرنامج طويل جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsDateString({}, { message: 'تاريخ بداية البرنامج غير صالح' })
  startDate!: string;

  /**
   * Copy the days and exercises from one of the trainer's saved templates.
   * Omit it to start from an empty programme.
   */
  @IsOptional()
  @IsUUID('4', { message: 'الجدول المختار غير صالح' })
  templateId?: string;
}
