export const IVA_RATE = 0.19;
export const SHIPPING_FEE_IN_CENTS = 5000 * 100;

export interface TransactionPricingBreakdown {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export function calculateTransactionPricing(
  subtotal: number,
): TransactionPricingBreakdown {
  const normalizedSubtotal = Math.max(0, subtotal);
  const tax = Math.round(normalizedSubtotal * IVA_RATE);
  const shipping = normalizedSubtotal > 0 ? SHIPPING_FEE_IN_CENTS : 0;

  return {
    subtotal: normalizedSubtotal,
    tax,
    shipping,
    total: normalizedSubtotal + tax + shipping,
  };
}
