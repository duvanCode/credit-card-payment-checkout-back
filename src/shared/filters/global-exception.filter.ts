import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: Record<string, unknown> = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrio un error inesperado.',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        payload = {
          code: 'HTTP_EXCEPTION',
          message: exceptionResponse,
        };
      } else {
        const responseBody = exceptionResponse as Record<string, unknown>;
        payload = {
          code: (responseBody.code as string) ?? this.defaultCode(status),
          message:
            (responseBody.message as string) ??
            (responseBody.error as string) ??
            'La solicitud no pudo ser procesada.',
          details: responseBody.details,
        };
      }
    }

    response.status(status).json({
      success: false,
      error: payload,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private defaultCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      402: 'PAYMENT_REQUIRED',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      504: 'TIMEOUT',
    };

    return codes[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
