import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../products/domain/repositories/product.repository';
import {
  PAYMENT_GATEWAY_PORT,
  PaymentGatewayPort,
  ProcessPaymentResult,
} from '../../../payment-gateway/application/ports/payment-gateway.port';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';
import { InitiateTransactionDto } from '../dtos/initiate-transaction.dto';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { ProductNotFoundException } from '../../../../shared/exceptions/product-not-found.exception';
import { InsufficientStockException } from '../../../../shared/exceptions/insufficient-stock.exception';
import { PaymentRequiredException } from '../../../../shared/exceptions/payment-required.exception';
import { ApiException } from '../../../../shared/exceptions/api.exception';

@Injectable()
export class InitiateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    payload: InitiateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const product = await this.productRepository.findById(payload.productId);

    if (!product) {
      throw new ProductNotFoundException(payload.productId);
    }

    const productData = product.toPrimitives();

    if (productData.stock < payload.quantity) {
      throw new InsufficientStockException(
        payload.productId,
        payload.quantity,
        productData.stock,
      );
    }

    const reference = this.generateReference();
    const totalAmount = productData.price * payload.quantity;
    const installments = payload.installments ?? 1;

    const transaction = await this.transactionRepository.create({
      reference,
      productId: payload.productId,
      quantity: payload.quantity,
      totalAmount,
      currency: productData.currency,
      status: TransactionStatus.PENDING,
      customerEmail: payload.customerData.email,
      customerName: payload.customerData.fullName,
      customerPhone: payload.customerData.phoneNumber,
      customerLegalId: payload.customerData.legalId,
      customerLegalIdType: payload.customerData.legalIdType,
      installments,
    });

    const acceptanceToken = await this.paymentGateway.getAcceptanceToken();
    const cardToken = await this.paymentGateway.tokenizeCard({
      number: payload.cardData.number,
      cvc: payload.cardData.cvc,
      expMonth: payload.cardData.expiryMonth,
      expYear: payload.cardData.expiryYear,
      cardHolder: payload.cardData.holderName,
    });

    const initialResult = await this.paymentGateway.createTransaction({
      reference,
      amountInCents: totalAmount,
      currency: productData.currency,
      customerEmail: payload.customerData.email,
      installments,
      cardToken,
      acceptanceToken,
      customerData: {
        fullName: payload.customerData.fullName,
        phoneNumber: payload.customerData.phoneNumber,
        legalId: payload.customerData.legalId,
        legalIdType: payload.customerData.legalIdType,
      },
    });

    const finalResult = await this.waitForFinalStatus(initialResult);
    const persisted = await this.transactionRepository.update(
      transaction.toPrimitives().id,
      {
        gatewayTransactionId: finalResult.gatewayTransactionId,
        status: this.toDomainStatus(finalResult.status),
        gatewayResponse: finalResult.rawResponse,
      },
    );

    if (finalResult.status === TransactionStatus.APPROVED) {
      await this.productRepository.decrementStock(payload.productId, payload.quantity);
      await this.transactionRepository.createDeliveryRecord({
        transactionId: persisted.toPrimitives().id,
        productId: payload.productId,
        quantity: payload.quantity,
        customerEmail: payload.customerData.email,
      });

      return {
        transactionId: persisted.toPrimitives().id,
        gatewayTransactionId: persisted.toPrimitives().gatewayTransactionId,
        status: persisted.toPrimitives().status,
        product: {
          id: productData.id,
          name: productData.name,
          quantity: payload.quantity,
        },
        amount: totalAmount,
        currency: productData.currency,
        createdAt: persisted.toPrimitives().createdAt.toISOString(),
      };
    }

    if (finalResult.status === TransactionStatus.DECLINED) {
      throw new PaymentRequiredException(
        'PAYMENT_DECLINED',
        'La transaccion fue rechazada por la pasarela.',
        finalResult.rawResponse,
      );
    }

    if (finalResult.status === TransactionStatus.ERROR) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PAYMENT_GATEWAY_ERROR',
        'La pasarela reporto un error al procesar la transaccion.',
        finalResult.rawResponse,
      );
    }

    throw new PaymentRequiredException(
      'PAYMENT_VOIDED',
      'La transaccion fue anulada.',
      finalResult.rawResponse,
    );
  }

  private async waitForFinalStatus(
    result: ProcessPaymentResult,
  ): Promise<ProcessPaymentResult> {
    let currentResult = result;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (currentResult.status !== TransactionStatus.PENDING) {
        return currentResult;
      }

      await this.delay(1200);
      currentResult = await this.paymentGateway.getTransactionStatus(
        currentResult.gatewayTransactionId,
      );
    }

    return currentResult;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private generateReference(): string {
    return `TRX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  private toDomainStatus(status: ProcessPaymentResult['status']): TransactionStatus {
    return status as TransactionStatus;
  }
}
