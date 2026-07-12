import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../products/domain/repositories/product.repository';
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
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    const product = await this.productRepository.findById(
      transaction.toPrimitives().productId,
    );

    const productData = product?.toPrimitives();
    const transactionData = transaction.toPrimitives();

    return {
      transactionId: transactionData.id,
      gatewayTransactionId: transactionData.gatewayTransactionId,
      status: transactionData.status,
      product: {
        id: transactionData.productId,
        name: productData?.name ?? 'Producto',
        quantity: transactionData.quantity,
      },
      amount: transactionData.totalAmount,
      currency: transactionData.currency,
      createdAt: transactionData.createdAt.toISOString(),
    };
  }
}
