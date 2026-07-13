import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';
import { TransactionNotFoundException } from '../../../../shared/exceptions/transaction-not-found.exception';

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    const transactionData = transaction.toPrimitives();
    const primaryItem = transactionData.items[0];
    const totalQuantity = transactionData.items.reduce(
      (accumulator, item) => accumulator + item.quantity,
      0,
    );

    return {
      transactionId: transactionData.id,
      reference: transactionData.reference,
      gatewayTransactionId: transactionData.gatewayTransactionId,
      status: transactionData.status,
      product: {
        id: primaryItem?.productId ?? transactionData.productId,
        name:
          primaryItem?.productName ??
          (transactionData.items.length > 1
            ? `${transactionData.items.length} productos`
            : 'Producto'),
        quantity: totalQuantity || transactionData.quantity,
      },
      amount: transactionData.totalAmount,
      currency: transactionData.currency,
      itemsCount: transactionData.items.length || 1,
      createdAt: transactionData.createdAt.toISOString(),
    };
  }
}
