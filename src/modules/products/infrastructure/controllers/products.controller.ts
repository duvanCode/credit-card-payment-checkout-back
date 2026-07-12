import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  getProducts() {
    return this.getProductsUseCase.execute();
  }

  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.getProductByIdUseCase.execute(id);
  }
}
