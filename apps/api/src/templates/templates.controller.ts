import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@wizzapp/shared';
import type {
  AuthenticatedUser,
  ProgramTemplateSummary,
  ProgramTemplateView,
} from '@wizzapp/shared';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { SaveTemplateDto } from './dto/save-template.dto';
import { TemplatesService } from './templates.service';

/**
 * Reusable workout plans the trainer keeps on the shelf. Private to each
 * trainer, and never visible to a client — a template is not a programme.
 */
@ApiTags('templates')
@ApiBearerAuth()
@ApiStandardErrors()
@Roles(Role.Trainer)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @ApiOperation({ summary: 'List the trainer’s saved workout templates' })
  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<ProgramTemplateSummary[]> {
    return this.templates.list(user.id);
  }

  @ApiOperation({ summary: 'Read one template with all its days and exercises' })
  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProgramTemplateView> {
    return this.templates.get(user.id, id);
  }

  @ApiOperation({ summary: 'Create a workout template' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveTemplateDto,
  ): Promise<ProgramTemplateView> {
    return this.templates.create(user.id, dto);
  }

  @ApiOperation({
    summary: 'Replace a template',
    description:
      'Sends the whole template. Days and exercises are replaced wholesale, so the body is the complete desired state, not a patch.',
  })
  @Put(':id')
  replace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveTemplateDto,
  ): Promise<ProgramTemplateView> {
    return this.templates.replace(user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Delete a template',
    description:
      'Programmes already created from this template are unaffected — applying copies rather than links.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.templates.remove(user.id, id);
  }
}
