import { InitiateTransactionUseCase } from './initiate-transaction.use-case';
import { ProductEntity } from '../../../products/domain/entities/product.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { InsufficientStockException } from '../../../../shared/exceptions/insufficient-stock.exception';
import { PaymentRequiredException } from '../../../../shared/exceptions/payment-required.exception';
import { ApiException } from '../../../../shared/exceptions/api.exception';
import { ProductNotFoundException } from '../../../../shared/exceptions/product-not-found.exception';
import { SHIPPING_FEE_IN_CENTS } from '../utils/pricing.util';

const product = new ProductEntity({
  id: 'prod-1',
  name: 'Laptop',
  description: 'Demo',
  price: 1000,
  currency: 'COP',
  stock: 10,
  imageUrl: 'https://example.com/image.png',
  category: 'Electronics',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const payload = {
  items: [
    {
      productId: 'prod-1',
      quantity: 2,
    },
  ],
  cardToken: 'tok_stagtest_12345_abcde12345',
  customerData: {
    email: 'john@example.com',
    fullName: 'John Doe',
    phoneNumber: '3001234567',
    legalId: '123456789',
    legalIdType: 'CC',
  },
  installments: 1,
};

const subtotalAmount = product.toPrimitives().price * payload.items[0].quantity;
const totalAmount = subtotalAmount + Math.round(subtotalAmount * 0.19) + SHIPPING_FEE_IN_CENTS;

describe('InitiateTransactionUseCase', () => {
  const createTransactionEntity = (status: TransactionStatus) =>
    new TransactionEntity({
      id: 'trx-1',
      gatewayTransactionId: status === TransactionStatus.PENDING ? 'gw-1' : 'gw-1',
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

  it('crea transaccion PENDING antes de llamar a la pasarela', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await useCase.execute(payload);

    expect(transactionRepository.create).toHaveBeenCalled();
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmount,
      }),
    );
    expect(gateway.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: totalAmount,
        cardToken: payload.cardToken,
      }),
    );
    expect(
      transactionRepository.create.mock.invocationCallOrder[0],
    ).toBeLessThan(gateway.createTransaction.mock.invocationCallOrder[0]);
    expect(transactionRepository.applyApprovedEffects).toHaveBeenCalledWith('trx-1');
  });

  it('actualiza a APPROVED y aplica stock cuando el pago aprueba', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );
    jest
      .spyOn(useCase as never, 'delay' as never)
      .mockResolvedValue(undefined as never);

    const result = await useCase.execute(payload);

    expect(transactionRepository.update).toHaveBeenCalled();
    expect(transactionRepository.applyApprovedEffects).toHaveBeenCalledWith('trx-1');
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productId: 'prod-1',
            quantity: 2,
          }),
        ],
      }),
    );
    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(result.itemsCount).toBe(1);
  });

  it('actualiza a DECLINED cuando la pasarela rechaza', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.DECLINED)),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.DECLINED,
        rawResponse: { status: 'DECLINED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      PaymentRequiredException,
    );
  });

  it('lanza error si no hay stock suficiente', async () => {
    const productRepository = {
      findById: jest.mocked(
        jest.fn().mockResolvedValue(
          new ProductEntity({
            ...product.toPrimitives(),
            stock: 1,
          }),
        ),
      ),
    };
    const transactionRepository = {
      create: jest.fn(),
      update: jest.fn(),
    };
    const gateway = {
      getAcceptanceToken: jest.fn(),
      createTransaction: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      InsufficientStockException,
    );
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('retorna PENDING cuando la pasarela no confirma el estado final', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.PENDING,
        rawResponse: { status: 'PENDING' },
      }),
      getTransactionStatus: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.PENDING,
        rawResponse: { status: 'PENDING' },
      }),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    const result = await useCase.execute(payload);

    expect(result.status).toBe(TransactionStatus.PENDING);
  }, 10000);

  it('lanza ProductNotFound cuando el producto no existe', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const transactionRepository = {
      create: jest.fn(),
      update: jest.fn(),
    };
    const gateway = {
      getAcceptanceToken: jest.fn(),
      createTransaction: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      ProductNotFoundException,
    );
  });

  it('lanza ApiException cuando no se envian items', async () => {
    const productRepository = {
      findById: jest.fn(),
    };
    const transactionRepository = {
      create: jest.fn(),
      update: jest.fn(),
    };
    const gateway = {
      getAcceptanceToken: jest.fn(),
      createTransaction: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(
      useCase.execute({
        ...payload,
        items: [],
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it('lanza ApiException cuando la pasarela retorna ERROR', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.ERROR)),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.ERROR,
        rawResponse: { status: 'ERROR' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(ApiException);
  });

  it('lanza PaymentRequiredException cuando la pasarela retorna VOIDED', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.VOIDED)),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.VOIDED,
        rawResponse: { status: 'VOIDED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      PaymentRequiredException,
    );
  });

  it('consolida items duplicados por productId', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await useCase.execute({
      ...payload,
      items: [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-1', quantity: 1 },
      ],
    });

    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productId: 'prod-1',
            quantity: 2,
          }),
        ],
      }),
    );
  });

  it('usa installments por defecto cuando no se envia', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    await useCase.execute({
      ...payload,
      installments: undefined,
    });

    expect(gateway.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        installments: 1,
      }),
    );
  });

  it('incluye nombre agregado cuando hay multiples items', async () => {
    const product2 = new ProductEntity({
      ...product.toPrimitives(),
      id: 'prod-2',
      name: 'Mouse',
    });

    const productRepository = {
      findById: jest
        .fn()
        .mockImplementation(async (id: string) =>
          id === 'prod-1' ? product : id === 'prod-2' ? product2 : null,
        ),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      applyApprovedEffects: jest.fn().mockResolvedValue(true),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      createTransaction: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'gw-1',
        status: TransactionStatus.APPROVED,
        rawResponse: { status: 'APPROVED' },
      }),
      getTransactionStatus: jest.fn(),
    };

    const useCase = new InitiateTransactionUseCase(
      productRepository as never,
      transactionRepository as never,
      gateway as never,
    );

    const result = await useCase.execute({
      ...payload,
      items: [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 1 },
      ],
    });

    expect(result.product.name).toBe('Laptop y 1 mas');
    expect(result.itemsCount).toBe(2);
  });
});
