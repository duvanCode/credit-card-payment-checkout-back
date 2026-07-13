import { calculateTransactionPricing, SHIPPING_FEE_IN_CENTS } from './pricing.util';

describe('calculateTransactionPricing', () => {
  it('calcula IVA y envio cuando subtotal es mayor a 0', () => {
    const result = calculateTransactionPricing(1000);
    expect(result.shipping).toBe(SHIPPING_FEE_IN_CENTS);
    expect(result.total).toBe(result.subtotal + result.tax + result.shipping);
  });

  it('no cobra envio si subtotal es 0 o negativo', () => {
    expect(calculateTransactionPricing(0).shipping).toBe(0);
    expect(calculateTransactionPricing(-10).shipping).toBe(0);
    expect(calculateTransactionPricing(-10).subtotal).toBe(0);
  });
});

