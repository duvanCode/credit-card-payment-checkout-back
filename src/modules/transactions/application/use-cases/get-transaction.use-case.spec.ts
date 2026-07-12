import { GetTransactionUseCase } from './get-transaction.use-case';
import { ProductEntity } from '../../../products/domain/entities/product.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

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
          totalAmount: 2000,
          currency: 'COP',
          status: TransactionStatus.APPROVED,
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          installments: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
    };
    const productRepository = {
      findById: jest.fn().mockResolvedValue(
        new ProductEntity({
          id: 'prod-1',
          name: 'Laptop',
          description: 'Demo',
          price: 1000,
          currency: 'COP',
          stock: 4,
          imageUrl: 'https://example.com/image.png',
          category: 'Electronics',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new GetTransactionUseCase(
      transactionRepository as never,
      productRepository as never,
    );

    const result = await useCase.execute('trx-1');

    expect(result.transactionId).toBe('trx-1');
    expect(result.product.name).toBe('Laptop');
  });
});
