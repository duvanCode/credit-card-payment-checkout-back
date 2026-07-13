import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  PaymentGatewayPort,
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '../application/ports/payment-gateway.port';
import { generateSignature } from '../../../shared/utils/signature.util';
import { InvalidCardException } from '../../../shared/exceptions/invalid-card.exception';
import { GatewayTimeoutException } from '../../../shared/exceptions/gateway-timeout.exception';
import { PaymentRequiredException } from '../../../shared/exceptions/payment-required.exception';
import { ApiException } from '../../../shared/exceptions/api.exception';

@Injectable()
export class PaymentGatewayService implements PaymentGatewayPort {
  private readonly client: AxiosInstance;
  private readonly sandboxUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(private readonly configService: ConfigService) {
    this.sandboxUrl = this.configService.getOrThrow<string>(
      'paymentGateway.sandboxUrl',
    );
    this.publicKey = this.configService.getOrThrow<string>(
      'paymentGateway.publicKey',
    );
    this.privateKey = this.configService.getOrThrow<string>(
      'paymentGateway.privateKey',
    );
    this.integrityKey = this.configService.getOrThrow<string>(
      'paymentGateway.integrityKey',
    );

    this.client = axios.create({
      baseURL: this.sandboxUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getAcceptanceToken(): Promise<string> {
    try {
      const response = await this.client.get(`/merchants/${this.publicKey}`);
      return (
        response.data?.data?.presigned_acceptance?.acceptance_token ??
        response.data?.data?.presigned_personal_data_auth?.acceptance_token
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTransaction(
    input: ProcessPaymentInput,
  ): Promise<ProcessPaymentResult> {
    try {
      const response = await this.client.post(
        '/transactions',
        {
          acceptance_token: input.acceptanceToken,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          customer_email: input.customerEmail,
          payment_method_type: 'CARD',
          payment_method: {
            type: 'CARD',
            token: input.cardToken,
            installments: input.installments,
          },
          reference: input.reference,
          signature: generateSignature(
            input.reference,
            input.amountInCents,
            input.currency,
            this.integrityKey,
          ),
          customer_data: {
            full_name: input.customerData.fullName,
            phone_number: input.customerData.phoneNumber,
            legal_id: input.customerData.legalId,
            legal_id_type: input.customerData.legalIdType,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        },
      );

      return this.mapTransactionResponse(response.data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTransactionStatus(
    transactionId: string,
  ): Promise<ProcessPaymentResult> {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.publicKey}`,
        },
      });

      return this.mapTransactionResponse(response.data);
    } catch (error) {
      this.handleError(error);
    }
  }

  private mapTransactionResponse(data: any): ProcessPaymentResult {
    const transactionData = data?.data;

    return {
      gatewayTransactionId: transactionData?.id,
      status: transactionData?.status,
      rawResponse: transactionData,
    };
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new GatewayTimeoutException();
      }

      const status = error.response?.status;
      const errorData = error.response?.data?.error ?? error.response?.data;
      const code = errorData?.type ?? errorData?.code;
      const message = errorData?.reason ?? errorData?.message ?? 'Error en la pasarela.';

      if (status === 402) {
        throw new PaymentRequiredException(code ?? 'PAYMENT_DECLINED', message, errorData);
      }

      if (
        status === 400 ||
        status === 422 ||
        code === 'INPUT_VALIDATION_ERROR' ||
        code === 'INVALID_CARD'
      ) {
        throw new InvalidCardException(errorData);
      }

      throw new ApiException(
        status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        code ?? 'PAYMENT_GATEWAY_ERROR',
        message,
        errorData,
      );
    }

    throw new ApiException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'PAYMENT_GATEWAY_ERROR',
      'No fue posible comunicarse con la pasarela.',
      error,
    );
  }
}
