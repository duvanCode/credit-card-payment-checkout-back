import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(
      {
        code,
        message,
        details,
      },
      status,
    );
  }
}
