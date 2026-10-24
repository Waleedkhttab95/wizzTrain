import { IsOptional, Matches } from 'class-validator';

export class DailyLogRangeDto {
  /** Inclusive lower bound, `YYYY-MM-DD`. Defaults to 30 days before `to`. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'تاريخ البداية يجب أن يكون بصيغة YYYY-MM-DD' })
  from?: string;

  /** Inclusive upper bound, `YYYY-MM-DD`. Defaults to today. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'تاريخ النهاية يجب أن يكون بصيغة YYYY-MM-DD' })
  to?: string;
}
