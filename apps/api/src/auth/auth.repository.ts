import { Injectable } from '@nestjs/common';
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

  findClientByEmail(email: string): Promise<AuthAccount | null> {
    return this.prisma.client.findUnique({ where: { email }, select: accountSelect });
  }

  findTrainerById(id: string): Promise<PublicAccount | null> {
    return this.prisma.trainer.findUnique({ where: { id }, select: publicSelect });
  }

  findClientById(id: string): Promise<PublicAccount | null> {
    return this.prisma.client.findUnique({ where: { id }, select: publicSelect });
  }
}
