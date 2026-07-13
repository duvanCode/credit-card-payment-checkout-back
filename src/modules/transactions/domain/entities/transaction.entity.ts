import { TransactionStatus } from '../enums/transaction-status.enum';

export interface TransactionProps {
  id: string;
  gatewayTransactionId?: string | null;
  reference: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: TransactionStatus;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  customerLegalId?: string | null;
  customerLegalIdType?: string | null;
  installments: number;
  gatewayResponse?: Record<string, unknown> | null;
  items: TransactionItemProps[];
  stockProcessedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItemProps {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt?: Date;
}

export class TransactionEntity {
  constructor(private readonly props: TransactionProps) {}

  toPrimitives(): TransactionProps {
    return this.props;
  }
}
