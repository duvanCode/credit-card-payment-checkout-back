import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { ProductNotFoundException } from '../../../../shared/exceptions/product-not-found.exception';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundException(productId);
    }

    return ProductResponseDto.fromEntity(product);
  }
}
