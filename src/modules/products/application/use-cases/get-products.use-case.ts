import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { ProductResponseDto } from '../dtos/product-response.dto';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll();
    return products.map(ProductResponseDto.fromEntity);
  }
}
