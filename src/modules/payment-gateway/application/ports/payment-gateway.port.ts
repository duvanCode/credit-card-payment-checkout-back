export const PAYMENT_GATEWAY_PORT = 'PAYMENT_GATEWAY_PORT';

export interface ProcessPaymentInput {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  installments: number;
  cardToken: string;
  acceptanceToken: string;
  customerData: {
    fullName: string;
    phoneNumber: string;
    legalId: string;
    legalIdType: string;
  };
}

export interface ProcessPaymentResult {
  gatewayTransactionId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  rawResponse: Record<string, unknown>;
}

export interface PaymentGatewayPort {
  getAcceptanceToken(): Promise<string>;
  createTransaction(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
  getTransactionStatus(
    transactionId: string,
  ): Promise<ProcessPaymentResult>;
}
