import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, ClientProfile, ClientSummary } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ResetClientPasswordDto } from './dto/reset-client-password.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

/** Client management. Trainer-only — clients never reach these routes (spec §9). */
@Roles(Role.Trainer)
@ApiTags('clients')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /** `?archived=true` returns the archived roster instead of the active one. */
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @Get()
  list(
    @CurrentUser() trainer: AuthenticatedUser,
    @Query('archived', new ParseBoolPipe({ optional: true })) archived?: boolean,
  ): Promise<ClientSummary[]> {
    return this.clientsService.list(trainer.id, archived ?? false);
  }

  @Post()
  create(
    @CurrentUser() trainer: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ): Promise<ClientProfile> {
    return this.clientsService.create(trainer.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() trainer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientProfile> {
    return this.clientsService.getProfile(id, trainer.id);
  }

  /** Takes a client off the roster without losing anything they recorded. */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':id/archive')
  archive(
    @CurrentUser() trainer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.clientsService.setArchived(trainer.id, id, true);
  }

  /** Puts them back, exactly as they were. */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/archive')
  unarchive(
    @CurrentUser() trainer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.clientsService.setArchived(trainer.id, id, false);
  }

  /** For a client who forgot theirs. The trainer hands over the new value. */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':id/password')
  resetPassword(
    @CurrentUser() trainer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetClientPasswordDto,
  ): Promise<void> {
    return this.clientsService.resetPassword(trainer.id, id, dto.password);
  }

  @Patch(':id')
  update(
    @CurrentUser() trainer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientProfile> {
    return this.clientsService.update(trainer.id, id, dto);
  }
}
