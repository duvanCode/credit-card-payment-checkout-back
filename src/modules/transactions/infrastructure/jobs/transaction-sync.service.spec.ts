import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TransactionSyncService } from './transaction-sync.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { SHIPPING_FEE_IN_CENTS } from '../../application/utils/pricing.util';

const subtotalAmount = 2000;
const totalAmount = subtotalAmount + Math.round(subtotalAmount * 0.19) + SHIPPING_FEE_IN_CENTS;

describe('TransactionSyncService', () => {
  const createTransaction = (status: TransactionStatus) =>
    new TransactionEntity({
      id: 'trx-1',
      gatewayTransactionId: 'gw-1',
      reference: 'TRX-1',
      productId: 'prod-1',
      quantity: 2,
      totalAmount,
      currency: 'COP',
      status,
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      customerPhone: '3001234567',
      customerLegalId: '123456789',
      customerLegalIdType: 'CC',
      installments: 1,
      gatewayResponse: { status },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Laptop',
          quantity: 2,
          unitPrice: 1000,
          subtotal: subtotalAmount,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      stockProcessedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  it('procesa una transaccion pendiente aprobada por la pasarela', async () => {
    const transactionRepository = {
      findPendingForSync: jest
        .fn()
        .mockResolvedValue([createTransaction(TransactionStatus.PENDING)]),
      findById: jest.fn().mockResolvedValue(createTransaction(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransaction(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
    };
    const configService = {
      get: jest.fn().mockReturnValue(300),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    await service.syncTransactions();

    expect(paymentGateway.getTransactionStatus).toHaveBeenCalledWith('gw-1');
    expect(transactionRepository.applyApprovedEffects).toHaveBeenCalledWith('trx-1');
  });

  it('programa el interval y ejecuta una corrida al iniciar', () => {
    jest.useFakeTimers();

    const transactionRepository = {
      findPendingForSync: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      update: jest.fn(),
      applyApprovedEffects: jest.fn(),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    const syncSpy = jest.spyOn(service, 'syncTransactions').mockResolvedValue();
    service.onModuleInit();

    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      'transaction-sync',
      expect.any(Object),
    );
    expect(syncSpy).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();
    expect(syncSpy).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('omite la ejecucion si el job ya esta en proceso', async () => {
    const transactionRepository = {
      findPendingForSync: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      update: jest.fn(),
      applyApprovedEffects: jest.fn(),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    const first = service.syncTransactions();
    const second = service.syncTransactions();

    await Promise.all([first, second]);
    expect(transactionRepository.findPendingForSync).toHaveBeenCalledTimes(1);
  });

  it('maneja errores al sincronizar sin romper el proceso', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const transactionRepository = {
      findPendingForSync: jest.fn().mockRejectedValue(new Error('db down')),
      findById: jest.fn(),
      update: jest.fn(),
      applyApprovedEffects: jest.fn(),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    await service.syncTransactions();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('omite transacciones si ya no existen', async () => {
    const transactionRepository = {
      findPendingForSync: jest
        .fn()
        .mockResolvedValue([createTransaction(TransactionStatus.PENDING)]),
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      applyApprovedEffects: jest.fn(),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    await service.syncTransactions();

    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
    expect(transactionRepository.applyApprovedEffects).not.toHaveBeenCalled();
  });

  it('no aplica efectos si el estado no es APPROVED', async () => {
    const transactionRepository = {
      findPendingForSync: jest
        .fn()
        .mockResolvedValue([createTransaction(TransactionStatus.PENDING)]),
      findById: jest.fn().mockResolvedValue(createTransaction(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransaction(TransactionStatus.DECLINED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.DECLINED,
        rawResponse: { status: 'DECLINED' },
      }),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    await service.syncTransactions();

    expect(transactionRepository.applyApprovedEffects).not.toHaveBeenCalled();
  });

  it('aplica efectos a transacciones APPROVED sin consultar la pasarela', async () => {
    const transactionRepository = {
      findPendingForSync: jest
        .fn()
        .mockResolvedValue([createTransaction(TransactionStatus.APPROVED)]),
      findById: jest.fn().mockResolvedValue(createTransaction(TransactionStatus.APPROVED)),
      update: jest.fn(),
      applyApprovedEffects: jest.fn().mockResolvedValue(false),
    };
    const paymentGateway = {
      getTransactionStatus: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const schedulerRegistry = {
      addInterval: jest.fn(),
    };

    const service = new TransactionSyncService(
      transactionRepository as never,
      paymentGateway as never,
      configService as unknown as ConfigService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    await service.syncTransactions();

    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
    expect(transactionRepository.applyApprovedEffects).toHaveBeenCalledWith('trx-1');
  });
});
