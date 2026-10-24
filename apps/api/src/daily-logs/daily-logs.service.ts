import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser, ClientDailyLogView, DailyLogView } from '@wizzapp/shared';
import { ClientAccessService } from '../clients/client-access.service';
import { addDays, parseIsoDate, startOfUtcDay, toIsoDate } from '../common/utils/date.util';
import { toDailyLogView } from './daily-logs.mapper';
import { DailyLogsRepository } from './daily-logs.repository';
import { DailyLogRangeDto } from './dto/daily-log-range.dto';
import { UpsertDailyLogDto } from './dto/upsert-daily-log.dto';

/** Default window for the trainer's log view when no range is supplied. */
const DEFAULT_RANGE_DAYS = 30;
/** Guard rail so one request cannot pull an unbounded history. */
const MAX_RANGE_DAYS = 366;

@Injectable()
export class DailyLogsService {
  constructor(
    private readonly logs: DailyLogsRepository,
    private readonly access: ClientAccessService,
  ) {}

  /** `POST /daily-logs` — the client submits (or re-submits) one day. */
  async upsertForClient(clientId: string, dto: UpsertDailyLogDto): Promise<DailyLogView> {
    const logDate = parseIsoDate(dto.logDate);

    // A log dated in the future is almost always a typo in the date field.
    if (logDate.getTime() > addDays(startOfUtcDay(new Date()), 1).getTime()) {
      throw new BadRequestException('لا يمكن تسجيل بيانات لتاريخ في المستقبل');
    }

    const row = await this.logs.upsert(clientId, logDate, {
      weightKg: dto.weightKg ?? null,
      caloriesActual: dto.caloriesActual ?? null,
      carbsGActual: dto.carbsGActual ?? null,
      proteinGActual: dto.proteinGActual ?? null,
      fatGActual: dto.fatGActual ?? null,
      fiberGActual: dto.fiberGActual ?? null,
      waterLActual: dto.waterLActual ?? null,
      sleepHours: dto.sleepHours ?? null,
      stepsActual: dto.stepsActual ?? null,
      notes: dto.notes ?? null,
    });

    return toDailyLogView(row);
  }

  /** `GET /clients/:id/daily-logs?from=&to=` (trainer) and the client's own history. */
  async listForClient(
    user: AuthenticatedUser,
    clientId: string,
    range: DailyLogRangeDto,
  ): Promise<DailyLogView[]> {
    await this.access.assertCanAccess(user, clientId);

    const { from, toExclusive } = resolveRange(range);
    const rows = await this.logs.findRange(clientId, from, toExclusive);
    return rows.map(toDailyLogView);
  }

  /**
   * The trainer's view of a client's logs, with a "did they train that day"
   * flag folded in from ExerciseLog (spec §F7 table in the design handoff).
   */
  async listForTrainer(
    user: AuthenticatedUser,
    clientId: string,
    range: DailyLogRangeDto,
  ): Promise<ClientDailyLogView[]> {
    await this.access.assertCanAccess(user, clientId);

    const { from, toExclusive } = resolveRange(range);
    const [rows, workoutDates] = await Promise.all([
      this.logs.findRange(clientId, from, toExclusive),
      this.logs.findWorkoutDates(clientId, from, toExclusive),
    ]);

    return rows.map((row) => ({
      ...toDailyLogView(row),
      workedOut: workoutDates.has(toIsoDate(row.logDate)),
    }));
  }

  async getByDate(clientId: string, isoDate: string): Promise<DailyLogView> {
    const row = await this.logs.findByDate(clientId, parseIsoDate(isoDate));
    if (!row) {
      throw new NotFoundException('لا يوجد سجل لهذا اليوم');
    }
    return toDailyLogView(row);
  }
}

/** Resolves an optional `from`/`to` pair into a half-open `[from, toExclusive)` window. */
export function resolveRange(range: DailyLogRangeDto): { from: Date; toExclusive: Date } {
  const to = range.to ? parseIsoDate(range.to) : startOfUtcDay(new Date());
  const from = range.from ? parseIsoDate(range.from) : addDays(to, -(DEFAULT_RANGE_DAYS - 1));

  if (from.getTime() > to.getTime()) {
    throw new BadRequestException('تاريخ البداية يجب أن يسبق تاريخ النهاية');
  }

  const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (spanDays > MAX_RANGE_DAYS) {
    throw new BadRequestException(
      `المدة المطلوبة كبيرة جدًا (الحد الأقصى ${MAX_RANGE_DAYS} يومًا)`,
    );
  }

  // Half-open upper bound keeps the `to` day itself inside the window.
  return { from, toExclusive: addDays(to, 1) };
}
