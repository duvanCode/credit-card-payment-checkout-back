import { ApiProperty } from '@nestjs/swagger';
import { ProductEntity } from '../../domain/entities/product.entity';

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  stock!: number;

  @ApiProperty()
  imageUrl!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: ProductEntity): ProductResponseDto {
    return Object.assign(new ProductResponseDto(), entity.toPrimitives());
  }
}
