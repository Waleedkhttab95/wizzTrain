import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** `POST /auth/password` — the caller changing their own password. */
export class ChangePasswordDto {
  @ApiProperty({ description: 'The password the caller signs in with today.' })
  @IsString({ message: 'كلمة المرور الحالية مطلوبة' })
  @MinLength(1, { message: 'كلمة المرور الحالية مطلوبة' })
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
  @MaxLength(128, { message: 'كلمة المرور طويلة جدًا' })
  newPassword!: string;
}
