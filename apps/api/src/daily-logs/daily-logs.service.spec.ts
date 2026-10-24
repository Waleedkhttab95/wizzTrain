import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClientAccessService } from '../clients/client-access.service';
import { parseIsoDate, toIsoDate } from '../common/utils/date.util';
import { DailyLogsRepository } from './daily-logs.repository';
import { DailyLogsService, resolveRange } from './daily-logs.service';

describe('DailyLogsService', () => {
  let service: DailyLogsService;
  let logs: jest.Mocked<DailyLogsRepository>;

  beforeEach(async () => {
    logs = {
      upsert: jest
        .fn()
        .mockImplementation((clientId: string, logDate: Date, values: object) =>
          Promise.resolve({ id: 'log-1', logDate, notes: null, ...values }),
        ),
      findRange: jest.fn().mockResolvedValue([]),
      findMetricsInRange: jest.fn().mockResolvedValue([]),
      findByDate: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<DailyLogsRepository>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        DailyLogsService,
        { provide: DailyLogsRepository, useValue: logs },
        { provide: ClientAccessService, useValue: { assertCanAccess: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(DailyLogsService);
  });

  describe('upsertForClient', () => {
    it('keys the record on the client and the calendar date', async () => {
      await service.upsertForClient('client-1', { logDate: '2026-08-24', weightKg: 80 });

      const [clientId, logDate] = logs.upsert.mock.calls[0];
      expect(clientId).toBe('client-1');
      expect(logDate.toISOString()).toBe('2026-08-24T00:00:00.000Z');
    });

    it('writes explicit nulls for fields the client left blank', async () => {
      await service.upsertForClient('client-1', { logDate: '2026-08-24', weightKg: 80 });

      // Nulls, not `undefined`: re-submitting a day must clear a value the
      // client removed, rather than silently keeping the old one.
      expect(logs.upsert.mock.calls[0][2]).toMatchObject({
        weightKg: 80,
        caloriesActual: null,
        sleepHours: null,
        notes: null,
      });
    });

    it('rejects a date in the future as a likely typo', async () => {
      const nextMonth = new Date(Date.now() + 30 * 86_400_000);

      await expect(
        service.upsertForClient('client-1', { logDate: toIsoDate(nextMonth) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(logs.upsert).not.toHaveBeenCalled();
    });

    it('accepts today, whatever the timezone offset', async () => {
      await expect(
        service.upsertForClient('client-1', { logDate: toIsoDate(new Date()) }),
      ).resolves.toBeDefined();
    });

    it('rejects a malformed date before it reaches the database', async () => {
      await expect(
        service.upsertForClient('client-1', { logDate: '2026-02-31' }),
      ).rejects.toBeInstanceOf(RangeError);
      expect(logs.upsert).not.toHaveBeenCalled();
    });
  });
});

describe('resolveRange', () => {
  it('makes the upper bound exclusive so the "to" day itself is included', () => {
    const { from, toExclusive } = resolveRange({ from: '2026-08-24', to: '2026-08-30' });

    expect(from.toISOString()).toBe('2026-08-24T00:00:00.000Z');
    expect(toExclusive.toISOString()).toBe('2026-08-31T00:00:00.000Z');
  });

  it('defaults to the 30 days ending at "to"', () => {
    const { from, toExclusive } = resolveRange({ to: '2026-08-30' });

    expect(from.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(toExclusive.toISOString()).toBe('2026-08-31T00:00:00.000Z');
  });

  it('accepts a single-day window', () => {
    const { from, toExclusive } = resolveRange({ from: '2026-08-24', to: '2026-08-24' });

    expect(toExclusive.getTime() - from.getTime()).toBe(86_400_000);
  });

  it('rejects an inverted range', () => {
    expect(() => resolveRange({ from: '2026-08-30', to: '2026-08-24' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects a window longer than a year', () => {
    expect(() => resolveRange({ from: '2024-01-01', to: '2026-01-01' })).toThrow(
      BadRequestException,
    );
  });

  it('allows exactly 366 days', () => {
    const from = parseIsoDate('2026-01-01');
    const to = new Date(from.getTime() + 365 * 86_400_000);

    expect(() => resolveRange({ from: '2026-01-01', to: toIsoDate(to) })).not.toThrow();
  });
});
