import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ProductResponseDto } from '../../application/dtos/product-response.dto';
import { getPublicImageUrl } from '../../../../shared/utils/public-url.util';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  async getProducts(@Req() request: Request) {
    const products = await this.getProductsUseCase.execute();
    return products.map(product => this.withResolvedImageUrl(product, request));
  }

  @Get(':id')
  async getProductById(@Param('id') id: string, @Req() request: Request) {
    const product = await this.getProductByIdUseCase.execute(id);
    return this.withResolvedImageUrl(product, request);
  }

  private withResolvedImageUrl(product: ProductResponseDto, request: Request) {
    return {
      ...product,
      imageUrl: getPublicImageUrl(product.imageUrl, request),
    };
  }
}
