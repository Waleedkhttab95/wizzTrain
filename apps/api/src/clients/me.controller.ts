import { Controller, Get } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, ClientSelfView } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';

/**
 * The client's view of their own record. Separate from ClientsController,
 * which is trainer-only at the class level — mixing the two roles on one
 * controller is how role bugs get in.
 */
@Roles(Role.Client)
@Controller('me')
export class MeController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  profile(@CurrentUser() user: AuthenticatedUser): Promise<ClientSelfView> {
    return this.clients.getSelf(user.id);
  }
}
