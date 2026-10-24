import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, JwtPayload, LoginResponse } from '@wizzapp/shared';
import { AuthRepository } from './auth.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AuthRepository,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();

    // Trainer first: there is exactly one, and the two tables share a unique
    // email space in practice, so at most one branch can match.
    const trainer = await this.accounts.findTrainerByEmail(email);
    if (trainer) {
      return this.issue(trainer, Role.Trainer, dto.password);
    }

    const client = await this.accounts.findClientByEmail(email);
    if (client) {
      // Check the password first regardless, so an archived account cannot be
      // distinguished from a live one by how fast the request comes back.
      const response = await this.issue(client, Role.Client, dto.password);
      if (client.archivedAt) {
        throw new UnauthorizedException(ARCHIVED_MESSAGE);
      }
      return response;
    }

    // Run a hash comparison against a dummy value even when no account exists,
    // so response timing does not reveal which emails are registered.
    await this.passwords.compare(dto.password, DUMMY_HASH);
    throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  /**
   * Changes the caller's own password. Proving the current one matters even
   * though the caller already holds a valid token: a token left behind on a
   * shared device should not be enough to lock its owner out of the account.
   */
  async changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<void> {
    const account = await this.accounts.findAccountById(user.role, user.id);
    if (!account) {
      throw new UnauthorizedException('الحساب لم يعد موجودًا');
    }

    // 400, not 401: the caller's token is perfectly valid — one field of the
    // body is wrong. The web client treats any 401 as an expired session and
    // signs the user out, so a mistyped password must not look like one.
    const matches = await this.passwords.compare(dto.currentPassword, account.passwordHash);
    if (!matches) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('كلمة المرور الجديدة مطابقة للحالية');
    }

    await this.accounts.updatePassword(
      user.role,
      user.id,
      await this.passwords.hash(dto.newPassword),
    );
  }

  /** Resolves the JWT payload into the principal attached to the request. */
  async validatePayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const account =
      payload.role === Role.Trainer
        ? await this.accounts.findTrainerById(payload.sub)
        : payload.role === Role.Client
          ? await this.accounts.findClientById(payload.sub)
          : null;

    // The account may have been deleted since the token was issued.
    if (!account) {
      throw new UnauthorizedException('الحساب لم يعد موجودًا');
    }

    // Archiving has to bite here too. Tokens live for days, so checking only
    // at login would leave an archived client signed in for the rest of the
    // week.
    if ('archivedAt' in account && account.archivedAt) {
      throw new UnauthorizedException(ARCHIVED_MESSAGE);
    }

    return { id: account.id, role: payload.role, email: account.email, name: account.name };
  }

  private async issue(
    account: { id: string; name: string; email: string; passwordHash: string },
    role: Role,
    password: string,
  ): Promise<LoginResponse> {
    const matches = await this.passwords.compare(password, account.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const payload: JwtPayload = { sub: account.id, role };

    return {
      accessToken: await this.jwt.signAsync(payload),
      role,
      user: { id: account.id, name: account.name, email: account.email },
    };
  }
}

/** Says the account is closed without hinting at why, or by whom. */
const ARCHIVED_MESSAGE = 'هذا الحساب موقوف. تواصل مع مدربك.';

/** A real bcrypt hash of a value nobody can guess; only used to equalise timing. */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO6b5T3dGX4z3n0lQm0K4qBqNqQ8oNQZa';
