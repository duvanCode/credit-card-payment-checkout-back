import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InitiateTransactionDto } from '../../application/dtos/initiate-transaction.dto';
import { ListTransactionsQueryDto } from '../../application/dtos/list-transactions-query.dto';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { InitiateTransactionUseCase } from '../../application/use-cases/initiate-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly initiateTransactionUseCase: InitiateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
  ) {}

  @Get()
  getTransactions(@Query() query: ListTransactionsQueryDto) {
    return this.listTransactionsUseCase.execute(query.limit);
  }

  @Post('initiate')
  initiate(@Body() payload: InitiateTransactionDto) {
    return this.initiateTransactionUseCase.execute(payload);
  }

  @Get(':id')
  getTransaction(@Param('id') id: string) {
    return this.getTransactionUseCase.execute(id);
  }
}
