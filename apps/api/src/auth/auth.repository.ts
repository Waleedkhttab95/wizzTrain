import { Injectable } from '@nestjs/common';
import { Role } from '@wizzapp/shared';
import { PrismaService } from '../prisma/prisma.service';

/** The identity fields the auth flow needs — nothing more. */
export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

const accountSelect = {
  id: true,
  name: true,
  email: true,
  passwordHash: true,
} as const;

/** A client account plus the one field that can close it. */
const clientAccountSelect = { ...accountSelect, archivedAt: true } as const;

export interface ClientAuthAccount extends AuthAccount {
  archivedAt: Date | null;
}

const publicSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export type PublicAccount = { id: string; name: string; email: string };

/**
 * Trainers and clients live in separate tables, so every auth lookup has to
 * check both. Keeping that fan-out here leaves AuthService free of schema detail.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTrainerByEmail(email: string): Promise<AuthAccount | null> {
    return this.prisma.trainer.findUnique({ where: { email }, select: accountSelect });
  }

  findClientByEmail(email: string): Promise<ClientAuthAccount | null> {
    return this.prisma.client.findUnique({ where: { email }, select: clientAccountSelect });
  }

  findTrainerById(id: string): Promise<PublicAccount | null> {
    return this.prisma.trainer.findUnique({ where: { id }, select: publicSelect });
  }

  findClientById(id: string): Promise<(PublicAccount & { archivedAt: Date | null }) | null> {
    return this.prisma.client.findUnique({
      where: { id },
      select: { ...publicSelect, archivedAt: true },
    });
  }

  /** Like the two lookups above, but carrying the hash a password change needs. */
  findAccountById(role: Role, id: string): Promise<AuthAccount | null> {
    return role === Role.Trainer
      ? this.prisma.trainer.findUnique({ where: { id }, select: accountSelect })
      : this.prisma.client.findUnique({ where: { id }, select: accountSelect });
  }

  async updatePassword(role: Role, id: string, passwordHash: string): Promise<void> {
    if (role === Role.Trainer) {
      await this.prisma.trainer.update({ where: { id }, data: { passwordHash } });
      return;
    }
    await this.prisma.client.update({ where: { id }, data: { passwordHash } });
  }
}
