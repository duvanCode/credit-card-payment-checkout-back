import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ProductsModule } from '../products/products.module';
import {
  TRANSACTION_REPOSITORY,
} from './domain/repositories/transaction.repository';
import { PrismaTransactionRepository } from './infrastructure/repositories/prisma-transaction.repository';
import { TransactionsController } from './infrastructure/controllers/transactions.controller';
import { InitiateTransactionUseCase } from './application/use-cases/initiate-transaction.use-case';
import { GetTransactionUseCase } from './application/use-cases/get-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';
import { TransactionSyncService } from './infrastructure/jobs/transaction-sync.service';

@Module({
  imports: [ProductsModule, PaymentGatewayModule],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    InitiateTransactionUseCase,
    GetTransactionUseCase,
    ListTransactionsUseCase,
    TransactionSyncService,
  ],
})
export class TransactionsModule {}
