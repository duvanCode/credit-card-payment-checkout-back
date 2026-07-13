import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('formatea excepcion HttpException con response string', () => {
    const filter = new GlobalExceptionFilter();
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const responseMock = { status: statusMock };
    const requestMock = { url: '/test' };
    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'HTTP_EXCEPTION',
          message: 'No autorizado',
        },
        path: '/test',
      }),
    );
  });

  it('formatea excepcion desconocida como INTERNAL_SERVER_ERROR', () => {
    const filter = new GlobalExceptionFilter();
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const responseMock = { status: statusMock };
    const requestMock = { url: '/unknown' };
    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('boom'), hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocurrio un error inesperado.',
        },
        path: '/unknown',
      }),
    );
  });

  it('formatea excepcion HttpException con payload object y defaultCode', () => {
    const filter = new GlobalExceptionFilter();
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const responseMock = { status: statusMock };
    const requestMock = { url: '/bad' };
    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException({}, HttpStatus.BAD_REQUEST);
    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
        }),
      }),
    );
  });

  it('usa default INTERNAL_SERVER_ERROR cuando el status no esta mapeado', () => {
    const filter = new GlobalExceptionFilter();
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const responseMock = { status: statusMock };
    const requestMock = { url: '/teapot' };
    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException({}, 418);
    filter.catch(exception, hostMock);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
        }),
      }),
    );
  });
});
