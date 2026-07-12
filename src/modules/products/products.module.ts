import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  PRODUCT_REPOSITORY,
} from './domain/repositories/product.repository';
import { GetProductsUseCase } from './application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    PrismaService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    GetProductsUseCase,
    GetProductByIdUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
