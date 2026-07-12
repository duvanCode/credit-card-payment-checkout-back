import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { ProductEntity } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<ProductEntity[]> {
    const products = await this.prismaService.product.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return products.map((product) => this.toEntity(product));
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    return product ? this.toEntity(product) : null;
  }

  async decrementStock(id: string, quantity: number): Promise<ProductEntity> {
    const product = await this.prismaService.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    return this.toEntity(product);
  }

  private toEntity(product: Product): ProductEntity {
    return new ProductEntity(product);
  }
}
