import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export class GatewayTimeoutException extends ApiException {
  constructor(details?: unknown) {
    super(
      HttpStatus.GATEWAY_TIMEOUT,
      'TIMEOUT',
      'La pasarela de pagos no respondio a tiempo.',
      details,
    );
  }
}
