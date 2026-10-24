import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, NutritionPlanView } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { NutritionService } from './nutrition.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

/** Nutrition plans the trainer authors for one client (spec §F4). */
@Roles(Role.Trainer)
@ApiTags('nutrition')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('clients/:clientId/nutrition-plan')
export class ClientNutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<NutritionPlanView> {
    return this.nutrition.getForClient(user, clientId);
  }

  /** Set this client's daily targets and meals, superseding any previous plan. */
  @ApiOperation({
    summary: "Set this client's daily nutrition targets and meals",
    description:
      'Creating a plan retires the previous active one in the same transaction, so GET /nutrition-plan/active always resolves to exactly one plan.',
  })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateNutritionPlanDto,
  ): Promise<NutritionPlanView> {
    return this.nutrition.createForClient(user, clientId, dto);
  }
}

@ApiTags('nutrition')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('nutrition-plan')
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  /** The caller's own active nutrition plan, with all targets and meals. */
  // Declared before the `:id` route so "active" is never parsed as a UUID.

  @Roles(Role.Client)
  @Get('active')
  active(@CurrentUser() user: AuthenticatedUser): Promise<NutritionPlanView> {
    return this.nutrition.getActiveForClient(user.id);
  }

  @Roles(Role.Trainer)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNutritionPlanDto,
  ): Promise<NutritionPlanView> {
    return this.nutrition.update(user, id, dto);
  }
}
