import { SetMetadata } from '@nestjs/common';
import { Role } from '@wizzapp/shared';

export const ROLES_KEY = 'roles';

/** Restricts a route (or a whole controller) to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
