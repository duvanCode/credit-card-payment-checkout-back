import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InitiateTransactionDto } from '../../application/dtos/initiate-transaction.dto';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { InitiateTransactionUseCase } from '../../application/use-cases/initiate-transaction.use-case';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly initiateTransactionUseCase: InitiateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}

  @Post('initiate')
  initiate(@Body() payload: InitiateTransactionDto) {
    return this.initiateTransactionUseCase.execute(payload);
  }

  @Get(':id')
  getTransaction(@Param('id') id: string) {
    return this.getTransactionUseCase.execute(id);
  }
}
