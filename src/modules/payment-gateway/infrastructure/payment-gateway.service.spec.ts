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

  it('tokeniza una tarjeta y devuelve el token', async () => {
    client.post.mockResolvedValue({
      data: {
        data: {
          id: 'tok_test_123',
        },
      },
    });

    const service = new PaymentGatewayService(configService);
    const token = await service.tokenizeCard({
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '30',
      cardHolder: 'JOHN DOE',
    });

    expect(token).toBe('tok_test_123');
    expect(client.post).toHaveBeenCalled();
  });
});
