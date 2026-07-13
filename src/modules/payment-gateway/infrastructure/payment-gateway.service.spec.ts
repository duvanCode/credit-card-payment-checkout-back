import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayService } from './payment-gateway.service';

jest.mock('axios');

describe('PaymentGatewayService', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'paymentGateway.sandboxUrl': 'https://sandbox.example.com/v1',
        'paymentGateway.publicKey': 'pub_test_x',
        'paymentGateway.privateKey': 'prv_test_x',
        'paymentGateway.integrityKey': 'int_test_x',
      };

      return values[key];
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue(client);
  });

  it('obtiene el acceptance token desde merchants', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          presigned_acceptance: {
            acceptance_token: 'acceptance-token',
          },
        },
      },
    });

    const service = new PaymentGatewayService(configService);
    const token = await service.getAcceptanceToken();

    expect(client.get).toHaveBeenCalledWith('/merchants/pub_test_x');
    expect(token).toBe('acceptance-token');
  });

  it('crea una transaccion usando el cardToken recibido del frontend', async () => {
    client.post.mockResolvedValue({
      data: {
        data: {
          id: 'trx_test_123',
          status: 'PENDING',
        },
      },
    });

    const service = new PaymentGatewayService(configService);
    const response = await service.createTransaction({
      reference: 'TRX-1',
      amountInCents: 2000,
      currency: 'COP',
      customerEmail: 'john@example.com',
      installments: 1,
      cardToken: 'tok_stagtest_12345_abcde12345',
      acceptanceToken: 'acceptance-token',
      customerData: {
        fullName: 'John Doe',
        phoneNumber: '3001234567',
        legalId: '123456789',
        legalIdType: 'CC',
      },
    });

    expect(response.gatewayTransactionId).toBe('trx_test_123');
    expect(client.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        acceptance_token: 'acceptance-token',
        payment_method: expect.objectContaining({
          token: 'tok_stagtest_12345_abcde12345',
        }),
      }),
      {
        headers: {
          Authorization: 'Bearer prv_test_x',
        },
      },
    );
  });
});
