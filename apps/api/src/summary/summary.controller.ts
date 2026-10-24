import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, WeeklySummaryView } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { WeeklySummaryQueryDto } from './dto/weekly-summary-query.dto';
import { SummaryService } from './summary.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

/** One client's aggregated week, computed live from their logs (spec §F8). */
@Roles(Role.Trainer)
@ApiTags('summary')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('clients/:clientId/weekly-summary')
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get()
  weekly(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: WeeklySummaryQueryDto,
  ): Promise<WeeklySummaryView> {
    return this.summary.getWeeklySummary(user, clientId, query.week);
  }
}

/** The same weekly figures for the caller's own week, so the app can show progress. */
@Roles(Role.Client)
@ApiTags('summary')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('summary')
export class MySummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get('weekly')
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WeeklySummaryQueryDto,
  ): Promise<WeeklySummaryView> {
    return this.summary.getWeeklySummary(user, user.id, query.week);
  }
}
