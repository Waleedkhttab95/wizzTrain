import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser } from '@wizzapp/shared';
import { ClientAccessService } from './client-access.service';
import { ClientsRepository } from './clients.repository';

const TRAINER: AuthenticatedUser = {
  id: 'trainer-1',
  role: Role.Trainer,
  email: 'trainer@wizzapp.local',
  name: 'المدرب',
};

const CLIENT: AuthenticatedUser = {
  id: 'client-1',
  role: Role.Client,
  email: 'client@wizzapp.local',
  name: 'متدرب',
};

describe('ClientAccessService', () => {
  let service: ClientAccessService;
  let clients: jest.Mocked<ClientsRepository>;

  beforeEach(async () => {
    clients = { existsForTrainer: jest.fn() } as unknown as jest.Mocked<ClientsRepository>;

    const moduleRef = await Test.createTestingModule({
      providers: [ClientAccessService, { provide: ClientsRepository, useValue: clients }],
    }).compile();

    service = moduleRef.get(ClientAccessService);
  });

  it('lets a trainer reach a client they own', async () => {
    clients.existsForTrainer.mockResolvedValue(true);

    await expect(service.assertCanAccess(TRAINER, 'client-1')).resolves.toBeUndefined();
    expect(clients.existsForTrainer).toHaveBeenCalledWith('client-1', TRAINER.id);
  });

  it('reports a client owned by another trainer as missing, not forbidden', async () => {
    // 404 keeps a trainer from probing which client ids exist elsewhere.
    clients.existsForTrainer.mockResolvedValue(false);

    await expect(service.assertCanAccess(TRAINER, 'someone-elses-client')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets a client reach their own record without a database round trip', async () => {
    await expect(service.assertCanAccess(CLIENT, CLIENT.id)).resolves.toBeUndefined();
    expect(clients.existsForTrainer).not.toHaveBeenCalled();
  });

  it("forbids a client from reaching another client's data", async () => {
    await expect(service.assertCanAccess(CLIENT, 'client-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
