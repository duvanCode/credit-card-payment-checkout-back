import { TransactionEntity, TransactionItemProps } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface CreateTransactionRepositoryDto {
  reference: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: TransactionStatus;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerLegalId?: string;
  customerLegalIdType?: string;
  installments: number;
  items: TransactionItemProps[];
}

export interface UpdateTransactionRepositoryDto {
  gatewayTransactionId?: string;
  status: TransactionStatus;
  gatewayResponse?: Record<string, unknown>;
  stockProcessedAt?: Date | null;
}

export interface CreateDeliveryRecordDto {
  transactionId: string;
  productId: string;
  quantity: number;
  customerEmail: string;
}

export interface TransactionRepository {
  create(data: CreateTransactionRepositoryDto): Promise<TransactionEntity>;
  update(id: string, data: UpdateTransactionRepositoryDto): Promise<TransactionEntity>;
  findById(id: string): Promise<TransactionEntity | null>;
  findRecent(limit: number): Promise<TransactionEntity[]>;
  findPendingForSync(): Promise<TransactionEntity[]>;
  createDeliveryRecord(data: CreateDeliveryRecordDto): Promise<void>;
  applyApprovedEffects(transactionId: string): Promise<boolean>;
}
