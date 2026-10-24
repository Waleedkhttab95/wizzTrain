import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * `POST /clients/:id/password` — the trainer issuing a replacement password
 * for a client who lost theirs. The trainer supplies the value and reads it
 * out to the client, exactly as at account creation: there is no email on
 * file to send a reset link to.
 */
export class ResetClientPasswordDto {
  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
  @MaxLength(128, { message: 'كلمة المرور طويلة جدًا' })
  password!: string;
}
