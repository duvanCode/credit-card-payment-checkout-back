import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class ProductNotFoundException extends ApiException {
  constructor(productId: string) {
    super(
      HttpStatus.NOT_FOUND,
      'PRODUCT_NOT_FOUND',
      `No se encontro el producto ${productId}.`,
    );
  }
}
