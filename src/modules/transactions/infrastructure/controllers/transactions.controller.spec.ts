import { TransactionsController } from './transactions.controller';

describe('TransactionsController', () => {
  it('lista transacciones con limit', async () => {
    const initiateTransactionUseCase = { execute: jest.fn() };
    const getTransactionUseCase = { execute: jest.fn() };
    const listTransactionsUseCase = {
      execute: jest.fn().mockResolvedValue([{ transactionId: 'trx-1' }]),
    };

    const controller = new TransactionsController(
      initiateTransactionUseCase as never,
      getTransactionUseCase as never,
      listTransactionsUseCase as never,
    );

    const result = await controller.getTransactions({ limit: 10 } as never);

    expect(listTransactionsUseCase.execute).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ transactionId: 'trx-1' }]);
  });

  it('inicia una transaccion', async () => {
    const initiateTransactionUseCase = {
      execute: jest.fn().mockResolvedValue({ transactionId: 'trx-9' }),
    };
    const getTransactionUseCase = { execute: jest.fn() };
    const listTransactionsUseCase = { execute: jest.fn() };

    const controller = new TransactionsController(
      initiateTransactionUseCase as never,
      getTransactionUseCase as never,
      listTransactionsUseCase as never,
    );

    const payload = { items: [{ productId: 'prod-1', quantity: 1 }] };
    const result = await controller.initiate(payload as never);

    expect(initiateTransactionUseCase.execute).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ transactionId: 'trx-9' });
  });

  it('consulta una transaccion por id', async () => {
    const initiateTransactionUseCase = { execute: jest.fn() };
    const getTransactionUseCase = {
      execute: jest.fn().mockResolvedValue({ transactionId: 'trx-2' }),
    };
    const listTransactionsUseCase = { execute: jest.fn() };

    const controller = new TransactionsController(
      initiateTransactionUseCase as never,
      getTransactionUseCase as never,
      listTransactionsUseCase as never,
    );

    const result = await controller.getTransaction('trx-2');

    expect(getTransactionUseCase.execute).toHaveBeenCalledWith('trx-2');
    expect(result).toEqual({ transactionId: 'trx-2' });
  });
});

