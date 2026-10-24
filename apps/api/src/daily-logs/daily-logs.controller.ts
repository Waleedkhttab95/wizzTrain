import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, ClientDailyLogView, DailyLogView } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DailyLogsService } from './daily-logs.service';
import { DailyLogRangeDto } from './dto/daily-log-range.dto';
import { UpsertDailyLogDto } from './dto/upsert-daily-log.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

@ApiTags('daily-logs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly dailyLogs: DailyLogsService) {}

  /** Submit one full day of measurements; upserts on clientId + logDate (spec §F7). */
  @ApiOperation({
    summary: 'Submit one full day of measurements',
    description:
      'One record per client per date. Re-posting the same logDate REPLACES the record — a field omitted on the second submission is cleared, not retained — so send the complete day each time. Dates are YYYY-MM-DD in UTC.',
  })
  @Roles(Role.Client)
  @Post()
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertDailyLogDto,
  ): Promise<DailyLogView> {
    return this.dailyLogs.upsertForClient(user.id, dto);
  }

  /** The caller's own log history, so the app can prefill previous days. */
  @Roles(Role.Client)
  @Get('me')
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() range: DailyLogRangeDto,
  ): Promise<DailyLogView[]> {
    return this.dailyLogs.listForClient(user, user.id, range);
  }

  @Roles(Role.Client)
  @Get('me/:date')
  mineByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ): Promise<DailyLogView> {
    return this.dailyLogs.getByDate(user.id, date);
  }
}

/** The trainer's date-ordered view of one client's logs (spec §9). */
@Roles(Role.Trainer)
@ApiTags('daily-logs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('clients/:clientId/daily-logs')
export class ClientDailyLogsController {
  constructor(private readonly dailyLogs: DailyLogsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() range: DailyLogRangeDto,
  ): Promise<ClientDailyLogView[]> {
    return this.dailyLogs.listForTrainer(user, clientId, range);
  }
}
