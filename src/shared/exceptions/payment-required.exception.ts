import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class PaymentRequiredException extends ApiException {
  constructor(code: string, message: string, details?: unknown) {
    super(HttpStatus.PAYMENT_REQUIRED, code, message, details);
  }
}
