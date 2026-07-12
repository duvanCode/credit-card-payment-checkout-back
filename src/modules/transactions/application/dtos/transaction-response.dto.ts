import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

export class TransactionProductSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quantity!: number;
}

export class TransactionResponseDto {
  @ApiProperty()
  transactionId!: string;

  @ApiProperty({ required: false, nullable: true })
  gatewayTransactionId?: string | null;

  @ApiProperty({ enum: TransactionStatus })
  status!: TransactionStatus;

  @ApiProperty({ type: TransactionProductSummaryDto })
  product!: TransactionProductSummaryDto;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  createdAt!: string;
}
