import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class TransactionNotFoundException extends ApiException {
  constructor(transactionId: string) {
    super(
      HttpStatus.NOT_FOUND,
      'TRANSACTION_NOT_FOUND',
      `No se encontro la transaccion ${transactionId}.`,
    );
  }
}
