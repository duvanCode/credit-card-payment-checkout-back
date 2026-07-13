import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';
import {
  PAYMENT_GATEWAY_PORT,
  PaymentGatewayPort,
} from '../../../payment-gateway/application/ports/payment-gateway.port';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

@Injectable()
export class TransactionSyncService implements OnModuleInit {
  private readonly logger = new Logger(TransactionSyncService.name);
  private readonly intervalSeconds: number;
  private isProcessing = false;

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.intervalSeconds = this.configService.get<number>(
      'jobs.transactionSyncIntervalSeconds',
      300,
    );
  }

  onModuleInit() {
    void this.syncTransactions();

    const interval = setInterval(() => {
      void this.syncTransactions();
    }, this.intervalSeconds * 1000);

    this.schedulerRegistry.addInterval('transaction-sync', interval);
    this.logger.log(
      `Transaction sync activo. Intervalo: ${this.intervalSeconds} segundos.`,
    );
  }

  async syncTransactions(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('El job de transacciones ya esta en ejecucion. Se omite esta corrida.');
      return;
    }

    this.isProcessing = true;

    try {
      const transactions = await this.transactionRepository.findPendingForSync();

      if (!transactions.length) {
        return;
      }

      for (const transaction of transactions) {
        await this.syncTransaction(transaction.toPrimitives().id);
      }
    } catch (error) {
      this.logger.error(
        'Fallo el job de sincronizacion de transacciones.',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncTransaction(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      return;
    }

    const transactionData = transaction.toPrimitives();

    let currentStatus = transactionData.status;

    if (
      transactionData.status === TransactionStatus.PENDING &&
      transactionData.gatewayTransactionId
    ) {
      const gatewayResult = await this.paymentGateway.getTransactionStatus(
        transactionData.gatewayTransactionId,
      );

      currentStatus = gatewayResult.status as TransactionStatus;

      await this.transactionRepository.update(transactionData.id, {
        gatewayTransactionId: gatewayResult.gatewayTransactionId,
        status: currentStatus,
        gatewayResponse: gatewayResult.rawResponse,
      });
    }

    if (currentStatus !== TransactionStatus.APPROVED) {
      return;
    }

    const processed = await this.transactionRepository.applyApprovedEffects(
      transactionData.id,
    );

    if (processed) {
      this.logger.log(
        `Transaccion ${transactionData.reference} aprobada y aplicada al stock.`,
      );
    }
  }
}
