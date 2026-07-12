import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class InvalidCardException extends ApiException {
  constructor(details?: unknown) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'INVALID_CARD',
      'Los datos de la tarjeta son invalidos.',
      details,
    );
  }
}
