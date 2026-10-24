import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser } from '@wizzapp/shared';
import { ClientsRepository } from './clients.repository';

/**
 * The one place that answers "may this caller touch this client's data?".
 * Every feature module imports ClientsModule for this, which keeps the
 * authorisation rule in a single testable unit and avoids each module growing
 * its own subtly different version.
 */
@Injectable()
export class ClientAccessService {
  constructor(private readonly clients: ClientsRepository) {}

  /**
   * A trainer may only reach clients they own; a client may only reach
   * themselves. Returns nothing — it throws when access is denied.
   */
  async assertCanAccess(user: AuthenticatedUser, clientId: string): Promise<void> {
    if (user.role === Role.Client) {
      if (user.id !== clientId) {
        throw new ForbiddenException('لا يمكنك الوصول إلى بيانات متدرب آخر');
      }
      return;
    }

    const owned = await this.clients.existsForTrainer(clientId, user.id);
    if (!owned) {
      // 404 rather than 403: a trainer should not be able to probe which client
      // IDs exist under other trainers.
      throw new NotFoundException('المتدرب غير موجود');
    }
  }
}
