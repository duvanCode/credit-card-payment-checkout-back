import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
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
});
