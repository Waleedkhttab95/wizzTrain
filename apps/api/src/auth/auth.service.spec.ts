import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@wizzapp/shared';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

const TRAINER = {
  id: 'trainer-1',
  name: 'المدرب',
  email: 'trainer@wizzapp.local',
  passwordHash: 'hashed-trainer',
};

const CLIENT = {
  id: 'client-1',
  name: 'متدرب',
  email: 'client@wizzapp.local',
  passwordHash: 'hashed-client',
};

describe('AuthService', () => {
  let service: AuthService;
  let accounts: jest.Mocked<AuthRepository>;
  let passwords: jest.Mocked<PasswordService>;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    accounts = {
      findTrainerByEmail: jest.fn().mockResolvedValue(null),
      findClientByEmail: jest.fn().mockResolvedValue(null),
      findTrainerById: jest.fn().mockResolvedValue(null),
      findClientById: jest.fn().mockResolvedValue(null),
      findAccountById: jest.fn().mockResolvedValue(null),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuthRepository>;

    passwords = {
      hash: jest.fn(),
      compare: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<PasswordService>;

    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    } as unknown as jest.Mocked<JwtService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: accounts },
        { provide: PasswordService, useValue: passwords },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('issues a trainer token when the trainer credentials match', async () => {
      accounts.findTrainerByEmail.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(true);

      const result = await service.login({ email: TRAINER.email, password: 'correct-password' });

      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        role: Role.Trainer,
        user: { id: TRAINER.id, name: TRAINER.name, email: TRAINER.email },
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: TRAINER.id, role: Role.Trainer });
    });

    it('issues a client token when no trainer owns the email', async () => {
      accounts.findClientByEmail.mockResolvedValue(CLIENT);
      passwords.compare.mockResolvedValue(true);

      const result = await service.login({ email: CLIENT.email, password: 'correct-password' });

      expect(result.role).toBe(Role.Client);
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: CLIENT.id, role: Role.Client });
    });

    it('normalises the email before looking the account up', async () => {
      accounts.findTrainerByEmail.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(true);

      await service.login({ email: '  TRAINER@Wizzapp.Local  ', password: 'correct-password' });

      expect(accounts.findTrainerByEmail).toHaveBeenCalledWith('trainer@wizzapp.local');
    });

    it('rejects a wrong password without issuing a token', async () => {
      accounts.findTrainerByEmail.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: TRAINER.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('gives an unknown email the same message as a wrong password', async () => {
      const unknown = service.login({ email: 'nobody@wizzapp.local', password: 'whatever12' });

      await expect(unknown).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('still runs a hash comparison for an unknown email, to level response timing', async () => {
      await expect(
        service.login({ email: 'nobody@wizzapp.local', password: 'whatever12' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(passwords.compare).toHaveBeenCalledTimes(1);
    });
  });

  describe('validatePayload', () => {
    it('resolves a trainer payload against the trainers table', async () => {
      accounts.findTrainerById.mockResolvedValue({
        id: TRAINER.id,
        name: TRAINER.name,
        email: TRAINER.email,
      });

      await expect(
        service.validatePayload({ sub: TRAINER.id, role: Role.Trainer }),
      ).resolves.toEqual({
        id: TRAINER.id,
        role: Role.Trainer,
        email: TRAINER.email,
        name: TRAINER.name,
      });
      expect(accounts.findClientById).not.toHaveBeenCalled();
    });

    it('rejects a token whose account has since been deleted', async () => {
      accounts.findClientById.mockResolvedValue(null);

      await expect(
        service.validatePayload({ sub: 'deleted-client', role: Role.Client }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('never resolves a client id against the trainers table', async () => {
      accounts.findTrainerById.mockResolvedValue({
        id: TRAINER.id,
        name: TRAINER.name,
        email: TRAINER.email,
      });

      await expect(
        service.validatePayload({ sub: TRAINER.id, role: Role.Client }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const CALLER = {
      id: TRAINER.id,
      role: Role.Trainer,
      email: TRAINER.email,
      name: TRAINER.name,
    };

    it('stores a hash of the new password once the current one checks out', async () => {
      accounts.findAccountById.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(true);
      passwords.hash.mockResolvedValue('hashed-new');

      await service.changePassword(CALLER, {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(passwords.compare).toHaveBeenCalledWith('old-password', TRAINER.passwordHash);
      expect(accounts.updatePassword).toHaveBeenCalledWith(
        Role.Trainer,
        TRAINER.id,
        'hashed-new',
      );
    });

    // 400 rather than 401 on purpose: the web client signs the user out on
    // any 401, and mistyping your own password should not do that.
    it('rejects a wrong current password and writes nothing', async () => {
      accounts.findAccountById.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(false);

      await expect(
        service.changePassword(CALLER, {
          currentPassword: 'wrong',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(accounts.updatePassword).not.toHaveBeenCalled();
    });

    it('refuses a new password identical to the current one', async () => {
      accounts.findAccountById.mockResolvedValue(TRAINER);
      passwords.compare.mockResolvedValue(true);

      await expect(
        service.changePassword(CALLER, {
          currentPassword: 'same-password',
          newPassword: 'same-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(accounts.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects a caller whose account has since been deleted', async () => {
      accounts.findAccountById.mockResolvedValue(null);

      await expect(
        service.changePassword(CALLER, {
          currentPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(passwords.compare).not.toHaveBeenCalled();
    });

    it('routes a client caller to the client table', async () => {
      accounts.findAccountById.mockResolvedValue(CLIENT);
      passwords.compare.mockResolvedValue(true);
      passwords.hash.mockResolvedValue('hashed-new');

      await service.changePassword(
        { id: CLIENT.id, role: Role.Client, email: CLIENT.email, name: CLIENT.name },
        { currentPassword: 'old-password', newPassword: 'new-password' },
      );

      expect(accounts.findAccountById).toHaveBeenCalledWith(Role.Client, CLIENT.id);
      expect(accounts.updatePassword).toHaveBeenCalledWith(Role.Client, CLIENT.id, 'hashed-new');
    });
  });

});
