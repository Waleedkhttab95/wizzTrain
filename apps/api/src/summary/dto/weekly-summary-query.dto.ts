import { IsOptional, Matches } from 'class-validator';

export class WeeklySummaryQueryDto {
  /**
   * ISO-8601 week, e.g. `2026-W35`. Defaults to the week containing today.
   * The `W` is optional so `2026-35` is also accepted.
   */
  @IsOptional()
  @Matches(/^\d{4}-W?\d{1,2}$/i, {
    message: 'صيغة الأسبوع غير صحيحة، استخدم الصيغة YYYY-Www مثل 2026-W35',
  })
  week?: string;
}
