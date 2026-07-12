import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class InsufficientStockException extends ApiException {
  constructor(productId: string, requested: number, available: number) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'INSUFFICIENT_STOCK',
      `Stock insuficiente para el producto ${productId}.`,
      {
        requested,
        available,
      },
    );
  }
}
