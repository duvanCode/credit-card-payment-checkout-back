import { InitiateTransactionUseCase } from './initiate-transaction.use-case';
import { ProductEntity } from '../../../products/domain/entities/product.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { InsufficientStockException } from '../../../../shared/exceptions/insufficient-stock.exception';
import { PaymentRequiredException } from '../../../../shared/exceptions/payment-required.exception';

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
  productId: 'prod-1',
  quantity: 2,
  cardData: {
    number: '4242424242424242',
    holderName: 'JOHN DOE',
    expiryMonth: '12',
    expiryYear: '30',
    cvc: '123',
  },
  customerData: {
    email: 'john@example.com',
    fullName: 'John Doe',
    phoneNumber: '3001234567',
    legalId: '123456789',
    legalIdType: 'CC',
  },
  installments: 1,
};

describe('InitiateTransactionUseCase', () => {
  const createTransactionEntity = (status: TransactionStatus) =>
    new TransactionEntity({
      id: 'trx-1',
      gatewayTransactionId: status === TransactionStatus.PENDING ? null : 'gw-1',
      reference: 'TRX-1',
      productId: 'prod-1',
      quantity: 2,
      totalAmount: 2000,
      currency: 'COP',
      status,
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      installments: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  it('crea transaccion PENDING antes de llamar a la pasarela', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
      decrementStock: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      createDeliveryRecord: jest.fn().mockResolvedValue(undefined),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      tokenizeCard: jest.fn().mockResolvedValue('card-token'),
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
    expect(
      transactionRepository.create.mock.invocationCallOrder[0],
    ).toBeLessThan(gateway.createTransaction.mock.invocationCallOrder[0]);
  });

  it('actualiza a APPROVED y descuenta stock cuando el pago aprueba', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
      decrementStock: jest.fn().mockResolvedValue(product),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.APPROVED)),
      createDeliveryRecord: jest.fn().mockResolvedValue(undefined),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      tokenizeCard: jest.fn().mockResolvedValue('card-token'),
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

    const result = await useCase.execute(payload);

    expect(transactionRepository.update).toHaveBeenCalled();
    expect(productRepository.decrementStock).toHaveBeenCalledWith('prod-1', 2);
    expect(transactionRepository.createDeliveryRecord).toHaveBeenCalled();
    expect(result.status).toBe(TransactionStatus.APPROVED);
  });

  it('actualiza a DECLINED y no descuenta stock cuando la pasarela rechaza', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(product),
      decrementStock: jest.fn(),
    };
    const transactionRepository = {
      create: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.PENDING)),
      update: jest.fn().mockResolvedValue(createTransactionEntity(TransactionStatus.DECLINED)),
      createDeliveryRecord: jest.fn(),
    };
    const gateway = {
      getAcceptanceToken: jest.fn().mockResolvedValue('acceptance-token'),
      tokenizeCard: jest.fn().mockResolvedValue('card-token'),
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
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
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
      decrementStock: jest.fn(),
    };
    const transactionRepository = {
      create: jest.fn(),
      update: jest.fn(),
      createDeliveryRecord: jest.fn(),
    };
    const gateway = {
      getAcceptanceToken: jest.fn(),
      tokenizeCard: jest.fn(),
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
});
