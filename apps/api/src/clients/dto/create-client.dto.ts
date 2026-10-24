import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString({ message: 'الاسم مطلوب' })
  @MinLength(2, { message: 'الاسم يجب ألا يقل عن حرفين' })
  @MaxLength(120, { message: 'الاسم طويل جدًا' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  /** The initial password; the trainer hands it to the client out of band. */
  @IsString({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
  @MaxLength(128, { message: 'كلمة المرور طويلة جدًا' })
  password!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الطول يجب أن يكون رقمًا' })
  @Min(50, { message: 'الطول غير منطقي' })
  @Max(260, { message: 'الطول غير منطقي' })
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'العمر يجب أن يكون رقمًا صحيحًا' })
  @Min(10, { message: 'العمر غير منطقي' })
  @Max(100, { message: 'العمر غير منطقي' })
  age?: number;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ البداية غير صالح' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+0-9\s()-]{7,20}$/, { message: 'رقم الهاتف غير صالح' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  /** Their weight on the day the programme starts (handoff: step 2). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الوزن الحالي يجب أن يكون رقمًا' })
  @Min(30, { message: 'الوزن الحالي غير منطقي' })
  @Max(300, { message: 'الوزن الحالي غير منطقي' })
  startWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الوزن المستهدف يجب أن يكون رقمًا' })
  @Min(30, { message: 'الوزن المستهدف غير منطقي' })
  @Max(300, { message: 'الوزن المستهدف غير منطقي' })
  goalWeightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'ملاحظة الهدف طويلة جدًا' })
  goalNote?: string;
}
