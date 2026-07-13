import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { PrismaTransactionRepository } from './prisma-transaction.repository';

describe('PrismaTransactionRepository', () => {
  const baseDate = new Date('2026-01-01T00:00:00.000Z');

  const transactionRecord = {
    id: 'trx-1',
    gatewayTransactionId: null,
    reference: 'TRX-1',
    productId: 'prod-1',
    quantity: 2,
    totalAmount: 2000,
    currency: 'COP',
    status: 'PENDING',
    customerEmail: 'john@example.com',
    customerName: 'John',
    customerPhone: null,
    customerLegalId: null,
    customerLegalIdType: null,
    installments: 1,
    gatewayResponse: null,
    stockProcessedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    items: [
      {
        id: 'item-1',
        transactionId: 'trx-1',
        productId: 'prod-1',
        productName: 'Laptop',
        quantity: 2,
        unitPrice: 1000,
        subtotal: 2000,
        createdAt: baseDate,
      },
    ],
  };

  it('create persiste y mapea la entidad', async () => {
    const prismaService = {
      transaction: {
        create: jest.fn().mockResolvedValue(transactionRecord),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);

    const entity = await repo.create({
      reference: 'TRX-1',
      productId: 'prod-1',
      quantity: 2,
      totalAmount: 2000,
      currency: 'COP',
      customerEmail: 'john@example.com',
      customerName: 'John',
      customerPhone: undefined,
      customerLegalId: undefined,
      customerLegalIdType: undefined,
      installments: 1,
      status: TransactionStatus.PENDING,
      items: [
        {
          productId: 'prod-1',
          productName: 'Laptop',
          quantity: 2,
          unitPrice: 1000,
          subtotal: 2000,
        },
      ],
    });

    expect(prismaService.transaction.create).toHaveBeenCalled();
    expect(entity.toPrimitives()).toEqual(
      expect.objectContaining({
        id: 'trx-1',
        reference: 'TRX-1',
        status: TransactionStatus.PENDING,
        items: [
          expect.objectContaining({
            productId: 'prod-1',
            productName: 'Laptop',
          }),
        ],
      }),
    );
  });

  it('findById retorna null si no existe', async () => {
    const prismaService = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('findById retorna entidad si existe', async () => {
    const prismaService = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue(transactionRecord),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.findById('trx-1');
    expect(result?.toPrimitives().id).toBe('trx-1');
  });

  it('findRecent retorna entidades', async () => {
    const prismaService = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([transactionRecord]),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.findRecent(5);

    expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true },
    });
    expect(result).toHaveLength(1);
  });

  it('update omite stockProcessedAt cuando es undefined', async () => {
    const prismaService = {
      transaction: {
        update: jest.fn().mockResolvedValue(transactionRecord),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);

    await repo.update('trx-1', {
      gatewayTransactionId: 'gw-1',
      status: TransactionStatus.APPROVED,
      gatewayResponse: { status: 'APPROVED' },
    });

    expect(prismaService.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stockProcessedAt: undefined,
        }),
      }),
    );
  });

  it('update persiste stockProcessedAt cuando es null', async () => {
    const prismaService = {
      transaction: {
        update: jest.fn().mockResolvedValue(transactionRecord),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);

    await repo.update('trx-1', {
      gatewayTransactionId: 'gw-1',
      status: TransactionStatus.APPROVED,
      gatewayResponse: { status: 'APPROVED' },
      stockProcessedAt: null,
    });

    expect(prismaService.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stockProcessedAt: null,
        }),
      }),
    );
  });

  it('findPendingForSync aplica filtro esperado', async () => {
    const prismaService = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([transactionRecord]),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.findPendingForSync();

    expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gatewayTransactionId: { not: null },
          OR: expect.any(Array),
        }),
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('createDeliveryRecord delega a prisma', async () => {
    const prismaService = {
      deliveryRecord: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    await repo.createDeliveryRecord({
      transactionId: 'trx-1',
      productId: 'prod-1',
      quantity: 2,
      customerEmail: 'john@example.com',
    });

    expect(prismaService.deliveryRecord.create).toHaveBeenCalledWith({
      data: {
        transactionId: 'trx-1',
        productId: 'prod-1',
        quantity: 2,
        customerEmail: 'john@example.com',
      },
    });
  });

  it('applyApprovedEffects retorna false cuando ya fue procesada', async () => {
    const prismaService = {
      $transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback({
          transaction: {
            findUnique: jest.fn().mockResolvedValue({
              ...transactionRecord,
              stockProcessedAt: new Date(),
              deliveryRecord: null,
            }),
          },
        });
      }),
    };

    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.applyApprovedEffects('trx-1');

    expect(result).toBe(false);
  });

  it('applyApprovedEffects retorna false cuando no existe la transaccion', async () => {
    const prismaService = {
      $transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback({
          transaction: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      }),
    };

    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.applyApprovedEffects('trx-404');

    expect(result).toBe(false);
  });

  it('applyApprovedEffects crea deliveryRecord y marca stockProcessedAt', async () => {
    const tx = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          ...transactionRecord,
          stockProcessedAt: null,
          deliveryRecord: null,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      deliveryRecord: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };

    const prismaService = {
      $transaction: jest.fn().mockImplementation(async (callback: any) => callback(tx)),
    };

    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.applyApprovedEffects('trx-1');

    expect(result).toBe(true);
    expect(tx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'prod-1',
        }),
      }),
    );
    expect(tx.deliveryRecord.create).toHaveBeenCalledTimes(1);
    expect(tx.transaction.update).toHaveBeenCalledTimes(1);
  });

  it('applyApprovedEffects no crea deliveryRecord si ya existe', async () => {
    const tx = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          ...transactionRecord,
          stockProcessedAt: null,
          deliveryRecord: { id: 'del-1' },
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      deliveryRecord: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };

    const prismaService = {
      $transaction: jest.fn().mockImplementation(async (callback: any) => callback(tx)),
    };

    const repo = new PrismaTransactionRepository(prismaService as never);
    const result = await repo.applyApprovedEffects('trx-1');

    expect(result).toBe(true);
    expect(tx.deliveryRecord.create).not.toHaveBeenCalled();
  });

  it('applyApprovedEffects lanza error si no alcanza stock', async () => {
    const tx = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          ...transactionRecord,
          stockProcessedAt: null,
          deliveryRecord: null,
        }),
        update: jest.fn(),
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      deliveryRecord: {
        create: jest.fn(),
      },
    };

    const prismaService = {
      $transaction: jest.fn().mockImplementation(async (callback: any) => callback(tx)),
    };

    const repo = new PrismaTransactionRepository(prismaService as never);

    await expect(repo.applyApprovedEffects('trx-1')).rejects.toThrow(
      'No fue posible descontar stock para el producto prod-1.',
    );
  });

  it('toEntity soporta transacciones sin items incluidos', () => {
    const prismaService = {
      transaction: {
        create: jest.fn(),
      },
    };
    const repo = new PrismaTransactionRepository(prismaService as never);
    const entity = (repo as unknown as { toEntity: (input: any) => any }).toEntity({
      ...transactionRecord,
      items: undefined,
    });

    expect(entity.toPrimitives().items).toEqual([]);
  });
});
