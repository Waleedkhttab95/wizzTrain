import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser, WeeklySummaryView } from '@wizzapp/shared';
import { ClientAccessService } from '../clients/client-access.service';
import {
  isoWeekOf,
  parseIsoWeek,
  previousIsoWeek,
  type IsoWeekRange,
} from '../common/utils/date.util';
import { DailyLogsRepository } from '../daily-logs/daily-logs.repository';
import { NutritionRepository } from '../nutrition/nutrition.repository';
import { SummaryRepository } from './summary.repository';
import {
  computeWeeklySummary,
  type AdherenceCounts,
  type DayActivity,
  type WeeklyInputs,
} from './weekly-summary.calculator';

const NO_ADHERENCE: AdherenceCounts = { planned: 0, logged: 0 };

/**
 * Computes the weekly summary live from DailyLog and ExerciseLog — there is no
 * stored aggregate at this stage (spec §F8).
 */
@Injectable()
export class SummaryService {
  constructor(
    private readonly dailyLogs: DailyLogsRepository,
    private readonly nutrition: NutritionRepository,
    private readonly summary: SummaryRepository,
    private readonly access: ClientAccessService,
  ) {}

  async getWeeklySummary(
    user: AuthenticatedUser,
    clientId: string,
    week?: string,
  ): Promise<WeeklySummaryView> {
    await this.access.assertCanAccess(user, clientId);

    const range = this.resolveWeek(week);
    const previous = previousIsoWeek(range);

    // Everything the summary needs, fetched concurrently: two log windows, the
    // active targets and the program the adherence rate is measured against.
    const [logs, previousLogs, targets, program] = await Promise.all([
      this.dailyLogs.findMetricsInRange(clientId, range.start, range.endExclusive),
      this.dailyLogs.findMetricsInRange(clientId, previous.start, previous.endExclusive),
      this.nutrition.findActiveTargets(clientId),
      this.summary.findActiveProgram(clientId),
    ]);

    const [adherence, previousAdherence, adherenceDays] = program
      ? await Promise.all([
          this.countAdherence(program, range),
          this.countAdherence(program, previous),
          this.dayActivity(program, range),
        ])
      : [NO_ADHERENCE, NO_ADHERENCE, [] as DayActivity[]];

    const inputs: WeeklyInputs = {
      range,
      logs,
      targets,
      adherence,
      adherenceDays,
      previous: { logs: previousLogs, adherence: previousAdherence },
    };

    return computeWeeklySummary(inputs);
  }

  /**
   * A week that ends before the program started has nothing planned, so it
   * reports no adherence rather than 0% against a program that did not exist.
   */
  private countAdherence(
    program: { id: string; startDate: Date },
    range: IsoWeekRange,
  ): Promise<AdherenceCounts> {
    if (program.startDate.getTime() > range.end.getTime()) {
      return Promise.resolve(NO_ADHERENCE);
    }
    return this.summary.countAdherence(program.id, range.start, range.endExclusive);
  }

  /** Empty for a week that ends before the program began, matching countAdherence. */
  private dayActivity(
    program: { id: string; startDate: Date },
    range: IsoWeekRange,
  ): Promise<DayActivity[]> {
    if (program.startDate.getTime() > range.end.getTime()) {
      return Promise.resolve([]);
    }
    return this.summary.findDayActivity(program.id, range.start, range.endExclusive);
  }

  private resolveWeek(week?: string): IsoWeekRange {
    if (!week) {
      return isoWeekOf(new Date());
    }

    try {
      return parseIsoWeek(week);
    } catch (error) {
      throw new BadRequestException(
        error instanceof RangeError
          ? 'صيغة الأسبوع غير صحيحة، استخدم الصيغة YYYY-Www مثل 2026-W35'
          : 'تعذّر قراءة الأسبوع المطلوب',
      );
    }
  }
}
