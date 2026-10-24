import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

/**
 * Email and password are deliberately not editable here: changing either has
 * account-recovery consequences that the MVP handles out of band.
 */
export class UpdateClientDto extends PartialType(
  OmitType(CreateClientDto, ['email', 'password'] as const),
) {}
