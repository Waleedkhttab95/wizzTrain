import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authConfig } from '../config/auth.config';

/**
 * Owns password hashing so no other service has to know the cost factor.
 * Exported from AuthModule and reused by ClientsService when the trainer
 * creates a client account.
 */
@Injectable()
export class PasswordService {
  constructor(@Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>) {}

  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, this.config.bcryptSaltRounds);
  }

  compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
