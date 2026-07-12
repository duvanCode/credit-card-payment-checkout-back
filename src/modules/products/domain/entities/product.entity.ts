export interface ProductProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  imageUrl: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductEntity {
  constructor(private readonly props: ProductProps) {}

  toPrimitives(): ProductProps {
    return this.props;
  }
}
