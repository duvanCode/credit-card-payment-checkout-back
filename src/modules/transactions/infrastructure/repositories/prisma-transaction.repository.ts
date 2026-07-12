import {
  DeliveryRecord,
  Prisma,
  Transaction,
  TransactionStatus as PrismaTransactionStatus,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import {
  CreateDeliveryRecordDto,
  CreateTransactionRepositoryDto,
  TransactionRepository,
  UpdateTransactionRepositoryDto,
} from '../../domain/repositories/transaction.repository';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    data: CreateTransactionRepositoryDto,
  ): Promise<TransactionEntity> {
    const transaction = await this.prismaService.transaction.create({
      data: {
        ...data,
        status: this.toPrismaStatus(data.status),
      },
    });

    return this.toEntity(transaction);
  }

  async update(
    id: string,
    data: UpdateTransactionRepositoryDto,
  ): Promise<TransactionEntity> {
    const transaction = await this.prismaService.transaction.update({
      where: { id },
      data: {
        gatewayTransactionId: data.gatewayTransactionId,
        gatewayResponse: data.gatewayResponse as Prisma.InputJsonValue,
        status: this.toPrismaStatus(data.status),
      },
    });

    return this.toEntity(transaction);
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
    });

    return transaction ? this.toEntity(transaction) : null;
  }

  async createDeliveryRecord(data: CreateDeliveryRecordDto): Promise<void> {
    await this.prismaService.deliveryRecord.create({
      data,
    });
  }

  private toEntity(transaction: Transaction): TransactionEntity {
    return new TransactionEntity({
      id: transaction.id,
      gatewayTransactionId: transaction.gatewayTransactionId,
      reference: transaction.reference,
      productId: transaction.productId,
      quantity: transaction.quantity,
      totalAmount: transaction.totalAmount,
      currency: transaction.currency,
      status: transaction.status as TransactionStatus,
      customerEmail: transaction.customerEmail,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerLegalId: transaction.customerLegalId,
      customerLegalIdType: transaction.customerLegalIdType,
      installments: transaction.installments,
      gatewayResponse: (transaction.gatewayResponse as Record<string, unknown>) ?? null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  }

  private toPrismaStatus(status: TransactionStatus): PrismaTransactionStatus {
    return status as PrismaTransactionStatus;
  }
}
