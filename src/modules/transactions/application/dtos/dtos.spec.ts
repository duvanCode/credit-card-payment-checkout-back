import { InitiateTransactionDto, TransactionItemDto } from './initiate-transaction.dto';
import { ListTransactionsQueryDto } from './list-transactions-query.dto';
import { TransactionResponseDto } from './transaction-response.dto';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

describe('transaction dtos', () => {
  it('se pueden instanciar', () => {
    const item = new TransactionItemDto();
    item.productId = 'prod-1';
    item.quantity = 1;

    const initiate = new InitiateTransactionDto();
    initiate.items = [item];
    initiate.cardToken = 'tok_test_123_abc';
    initiate.customerData = {
      email: 'john@example.com',
      fullName: 'John Doe',
      phoneNumber: '3001234567',
      legalId: '123',
      legalIdType: 'CC',
    };

    const query = new ListTransactionsQueryDto();
    query.limit = 10;

    const response = new TransactionResponseDto();
    response.transactionId = 'trx-1';
    response.reference = 'TRX-1';
    response.status = TransactionStatus.APPROVED;
    response.product = { id: 'prod-1', name: 'Laptop', quantity: 1 };
    response.amount = 1000;
    response.currency = 'COP';
    response.itemsCount = 1;
    response.createdAt = new Date().toISOString();

    expect(initiate.items[0].productId).toBe('prod-1');
    expect(query.limit).toBe(10);
    expect(response.transactionId).toBe('trx-1');
  });
});
