import { GatewayTimeoutException } from './gateway-timeout.exception';
import { InvalidCardException } from './invalid-card.exception';
import { PaymentRequiredException } from './payment-required.exception';
import { ProductNotFoundException } from './product-not-found.exception';
import { TransactionNotFoundException } from './transaction-not-found.exception';

describe('exceptions', () => {
  it('instancia excepciones con payload', () => {
    const timeout = new GatewayTimeoutException({ retry: true });
    const invalid = new InvalidCardException({ field: 'number' });
    const required = new PaymentRequiredException(
      'PAYMENT_DECLINED',
      'Rechazado',
      { reason: 'insufficient_funds' },
    );
    const productNotFound = new ProductNotFoundException('prod-1');
    const trxNotFound = new TransactionNotFoundException('trx-1');

    expect(timeout.getStatus()).toBe(504);
    expect(invalid.getStatus()).toBe(422);
    expect(required.getStatus()).toBe(402);
    expect(productNotFound.getStatus()).toBe(404);
    expect(trxNotFound.getStatus()).toBe(404);
  });
});

