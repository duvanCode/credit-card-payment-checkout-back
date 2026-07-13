import { ListTransactionsUseCase } from './list-transactions.use-case';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

describe('ListTransactionsUseCase', () => {
  it('mapea usando el item primario y cantidad total', async () => {
    const repository = {
      findRecent: jest.fn().mockResolvedValue([
        new TransactionEntity({
          id: 'trx-1',
          gatewayTransactionId: 'gw-1',
          reference: 'TRX-1',
          productId: 'prod-1',
          quantity: 3,
          totalAmount: 3000,
          currency: 'COP',
          status: TransactionStatus.APPROVED,
          customerEmail: 'john@example.com',
          customerName: 'John',
          customerPhone: null,
          customerLegalId: null,
          customerLegalIdType: null,
          installments: 1,
          gatewayResponse: null,
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Laptop',
              quantity: 1,
              unitPrice: 1000,
              subtotal: 1000,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'Mouse',
              quantity: 2,
              unitPrice: 1000,
              subtotal: 2000,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          ],
          stockProcessedAt: new Date('2026-01-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]),
    };

    const useCase = new ListTransactionsUseCase(repository as never);
    const result = await useCase.execute(12);

    expect(repository.findRecent).toHaveBeenCalledWith(12);
    expect(result).toEqual([
      expect.objectContaining({
        transactionId: 'trx-1',
        reference: 'TRX-1',
        itemsCount: 2,
        product: {
          id: 'prod-1',
          name: 'Laptop',
          quantity: 3,
        },
      }),
    ]);
  });

  it('si no hay items, retorna fallback de producto', async () => {
    const repository = {
      findRecent: jest.fn().mockResolvedValue([
        new TransactionEntity({
          id: 'trx-2',
          gatewayTransactionId: null,
          reference: 'TRX-2',
          productId: 'prod-x',
          quantity: 1,
          totalAmount: 1000,
          currency: 'COP',
          status: TransactionStatus.PENDING,
          customerEmail: 'john@example.com',
          customerName: 'John',
          customerPhone: null,
          customerLegalId: null,
          customerLegalIdType: null,
          installments: 1,
          gatewayResponse: null,
          items: [],
          stockProcessedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]),
    };

    const useCase = new ListTransactionsUseCase(repository as never);
    const result = await useCase.execute();

    expect(result[0].product.name).toBe('Producto');
    expect(result[0].itemsCount).toBe(1);
  });

  it('usa nombre agregado cuando el item primario no tiene nombre', async () => {
    const repository = {
      findRecent: jest.fn().mockResolvedValue([
        new TransactionEntity({
          id: 'trx-3',
          gatewayTransactionId: null,
          reference: 'TRX-3',
          productId: 'prod-3',
          quantity: 2,
          totalAmount: 2000,
          currency: 'COP',
          status: TransactionStatus.PENDING,
          customerEmail: 'john@example.com',
          customerName: 'John',
          customerPhone: null,
          customerLegalId: null,
          customerLegalIdType: null,
          installments: 1,
          gatewayResponse: null,
          items: [
            {
              id: 'item-1',
              productId: 'prod-3',
              productName: undefined as unknown as string,
              quantity: 1,
              unitPrice: 1000,
              subtotal: 1000,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            {
              id: 'item-2',
              productId: 'prod-4',
              productName: undefined as unknown as string,
              quantity: 1,
              unitPrice: 1000,
              subtotal: 1000,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          ],
          stockProcessedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]),
    };

    const useCase = new ListTransactionsUseCase(repository as never);
    const result = await useCase.execute();

    expect(result[0].itemsCount).toBe(2);
    expect(result[0].product.name).toBe('2 productos');
  });
});
