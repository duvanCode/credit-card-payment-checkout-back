import {
  DeliveryRecord,
  Prisma,
  Transaction,
  TransactionItem,
  TransactionStatus as PrismaTransactionStatus,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  TransactionEntity,
  TransactionItemProps,
} from '../../domain/entities/transaction.entity';
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
        reference: data.reference,
        productId: data.productId,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        currency: data.currency,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerLegalId: data.customerLegalId,
        customerLegalIdType: data.customerLegalIdType,
        installments: data.installments,
        status: this.toPrismaStatus(data.status),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
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
        stockProcessedAt:
          data.stockProcessedAt === undefined ? undefined : data.stockProcessedAt,
      },
      include: { items: true },
    });

    return this.toEntity(transaction);
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: { items: true },
    });

    return transaction ? this.toEntity(transaction) : null;
  }

  async findRecent(limit: number): Promise<TransactionEntity[]> {
    const transactions = await this.prismaService.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { items: true },
    });

    return transactions.map((transaction) => this.toEntity(transaction));
  }

  async findPendingForSync(): Promise<TransactionEntity[]> {
    const transactions = await this.prismaService.transaction.findMany({
      where: {
        gatewayTransactionId: {
          not: null,
        },
        OR: [
          {
            status: PrismaTransactionStatus.PENDING,
          },
          {
            status: PrismaTransactionStatus.APPROVED,
            stockProcessedAt: null,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { items: true },
    });

    return transactions.map((transaction) => this.toEntity(transaction));
  }

  async createDeliveryRecord(data: CreateDeliveryRecordDto): Promise<void> {
    await this.prismaService.deliveryRecord.create({
      data,
    });
  }

  async applyApprovedEffects(transactionId: string): Promise<boolean> {
    return this.prismaService.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true, deliveryRecord: true },
      });

      if (!transaction || transaction.stockProcessedAt) {
        return false;
      }

      for (const item of transaction.items) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (result.count === 0) {
          throw new Error(
            `No fue posible descontar stock para el producto ${item.productId}.`,
          );
        }
      }

      if (!transaction.deliveryRecord) {
        await tx.deliveryRecord.create({
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            quantity: transaction.quantity,
            customerEmail: transaction.customerEmail,
          },
        });
      }

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          stockProcessedAt: new Date(),
        },
      });

      return true;
    });
  }

  private toEntity(
    transaction: Transaction & { items?: TransactionItem[] },
  ): TransactionEntity {
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
      items: (transaction.items ?? []).map((item) => this.toItem(item)),
      stockProcessedAt: transaction.stockProcessedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  }

  private toItem(item: TransactionItem): TransactionItemProps {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      createdAt: item.createdAt,
    };
  }

  private toPrismaStatus(status: TransactionStatus): PrismaTransactionStatus {
    return status as PrismaTransactionStatus;
  }
}
