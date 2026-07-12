import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  PAYMENT_GATEWAY_PORT,
} from './application/ports/payment-gateway.port';
import { PaymentGatewayService } from './infrastructure/payment-gateway.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: PaymentGatewayService,
    },
  ],
  exports: [PAYMENT_GATEWAY_PORT],
})
export class PaymentGatewayModule {}
