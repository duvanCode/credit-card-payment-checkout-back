import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { GatewayTimeoutException } from '../../../shared/exceptions/gateway-timeout.exception';
import { InvalidCardException } from '../../../shared/exceptions/invalid-card.exception';
import { PaymentRequiredException } from '../../../shared/exceptions/payment-required.exception';

jest.mock('axios');
jest.mock('../../../shared/utils/signature.util', () => ({
  generateSignature: jest.fn(() => 'sig'),
}));

describe('PaymentGatewayService', () => {
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'paymentGateway.sandboxUrl') return 'https://sandbox.example.com';
      if (key === 'paymentGateway.publicKey') return 'pub';
      if (key === 'paymentGateway.privateKey') return 'prv';
      if (key === 'paymentGateway.integrityKey') return 'integrity';
      throw new Error(`Unexpected key ${key}`);
    }),
  };

  const client = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as unknown as jest.Mock).mockReturnValue(client);
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
  });

  it('inicializa el cliente con baseURL y timeout', () => {
    new PaymentGatewayService(configService as unknown as ConfigService);
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://sandbox.example.com',
        timeout: 15000,
      }),
    );
  });

  it('obtiene acceptance token por presigned_acceptance', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          presigned_acceptance: { acceptance_token: 'token-a' },
        },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);
    const token = await service.getAcceptanceToken();

    expect(client.get).toHaveBeenCalledWith('/merchants/pub');
    expect(token).toBe('token-a');
  });

  it('obtiene acceptance token por presigned_personal_data_auth', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          presigned_personal_data_auth: { acceptance_token: 'token-b' },
        },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);
    const token = await service.getAcceptanceToken();
    expect(token).toBe('token-b');
  });

  it('crea transaccion y mapea la respuesta', async () => {
    client.post.mockResolvedValue({
      data: {
        data: {
          id: 'gw-1',
          status: 'APPROVED',
        },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);
    const result = await service.createTransaction({
      reference: 'TRX-1',
      amountInCents: 5000,
      currency: 'COP',
      customerEmail: 'john@example.com',
      installments: 1,
      cardToken: 'tok',
      acceptanceToken: 'acc',
      customerData: {
        fullName: 'John',
        phoneNumber: '300',
        legalId: '123',
        legalIdType: 'CC',
      },
    });

    expect(client.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        reference: 'TRX-1',
        amount_in_cents: 5000,
        signature: 'sig',
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer prv' },
      }),
    );
    expect(result).toEqual({
      gatewayTransactionId: 'gw-1',
      status: 'APPROVED',
      rawResponse: { id: 'gw-1', status: 'APPROVED' },
    });
  });

  it('consulta estado de transaccion y mapea la respuesta', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          id: 'gw-2',
          status: 'PENDING',
        },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);
    const result = await service.getTransactionStatus('gw-2');

    expect(client.get).toHaveBeenCalledWith('/transactions/gw-2', {
      headers: { Authorization: 'Bearer pub' },
    });
    expect(result.status).toBe('PENDING');
  });

  it('lanza GatewayTimeoutException cuando expira', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({ code: 'ECONNABORTED' });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getAcceptanceToken()).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('lanza PaymentRequiredException cuando status 402', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    const errorData = { type: 'PAYMENT_DECLINED', reason: 'Rechazado' };
    client.post.mockRejectedValue({
      response: { status: 402, data: { error: errorData } },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(
      service.createTransaction({
        reference: 'TRX-1',
        amountInCents: 5000,
        currency: 'COP',
        customerEmail: 'john@example.com',
        installments: 1,
        cardToken: 'tok',
        acceptanceToken: 'acc',
        customerData: {
          fullName: 'John',
          phoneNumber: '300',
          legalId: '123',
          legalIdType: 'CC',
        },
      }),
    ).rejects.toBeInstanceOf(PaymentRequiredException);
  });

  it('lanza InvalidCardException para errores de validacion', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: { code: 'INPUT_VALIDATION_ERROR', message: 'Invalid' } },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(
      service.createTransaction({
        reference: 'TRX-1',
        amountInCents: 5000,
        currency: 'COP',
        customerEmail: 'john@example.com',
        installments: 1,
        cardToken: 'tok',
        acceptanceToken: 'acc',
        customerData: {
          fullName: 'John',
          phoneNumber: '300',
          legalId: '123',
          legalIdType: 'CC',
        },
      }),
    ).rejects.toBeInstanceOf(InvalidCardException);
  });

  it('lanza InvalidCardException cuando code es INVALID_CARD aunque status no sea 400/422', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({
      response: {
        status: 500,
        data: { error: { code: 'INVALID_CARD', message: 'Invalid' } },
      },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getAcceptanceToken()).rejects.toBeInstanceOf(InvalidCardException);
  });

  it('lanza ApiException para otros errores axios', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({
      response: { status: 500, data: { error: { message: 'oops' } } },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getAcceptanceToken()).rejects.toBeInstanceOf(ApiException);
  });

  it('usa payload del error directamente cuando no existe response.data.error', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({
      response: { status: 500, data: { code: 'FAIL', reason: 'bad' } },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getAcceptanceToken()).rejects.toBeInstanceOf(ApiException);
  });

  it('maneja error axios sin status', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({
      response: { data: { error: { message: 'unknown' } } },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getAcceptanceToken()).rejects.toBeInstanceOf(ApiException);
  });

  it('propaga error en getTransactionStatus usando handleError', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    client.get.mockRejectedValue({
      response: { status: 422, data: { error: { code: 'INPUT_VALIDATION_ERROR' } } },
    });

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    await expect(service.getTransactionStatus('gw-3')).rejects.toBeInstanceOf(
      InvalidCardException,
    );
  });

  it('lanza ApiException generico para errores no axios', async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
    client.get.mockRejectedValue(new Error('network'));

    const service = new PaymentGatewayService(configService as unknown as ConfigService);

    try {
      await service.getAcceptanceToken();
      throw new Error('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((error as ApiException).getResponse()).toEqual(
        expect.objectContaining({
          code: 'PAYMENT_GATEWAY_ERROR',
        }),
      );
    }
  });
});
