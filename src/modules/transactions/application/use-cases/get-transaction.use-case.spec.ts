import { GetTransactionUseCase } from './get-transaction.use-case';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { SHIPPING_FEE_IN_CENTS } from '../utils/pricing.util';

const subtotalAmount = 2000;
const totalAmount = subtotalAmount + Math.round(subtotalAmount * 0.19) + SHIPPING_FEE_IN_CENTS;

describe('GetTransactionUseCase', () => {
  it('retorna una transaccion existente', async () => {
    const transactionRepository = {
      findById: jest.fn().mockResolvedValue(
        new TransactionEntity({
          id: 'trx-1',
          gatewayTransactionId: 'gw-1',
          reference: 'TRX-1',
          productId: 'prod-1',
          quantity: 2,
          totalAmount,
          currency: 'COP',
          status: TransactionStatus.APPROVED,
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          customerPhone: '3001234567',
          customerLegalId: '123456789',
          customerLegalIdType: 'CC',
          installments: 1,
          gatewayResponse: { status: 'APPROVED' },
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
          stockProcessedAt: new Date('2026-01-01T01:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
    };

    const useCase = new GetTransactionUseCase(transactionRepository as never);

    const result = await useCase.execute('trx-1');

    expect(result.transactionId).toBe('trx-1');
    expect(result.reference).toBe('TRX-1');
    expect(result.product.name).toBe('Laptop');
    expect(result.itemsCount).toBe(1);
  });
});
