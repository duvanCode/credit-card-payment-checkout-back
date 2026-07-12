import { GetProductByIdUseCase } from './get-product-by-id.use-case';
import { ProductEntity } from '../../domain/entities/product.entity';
import { ProductNotFoundException } from '../../../../shared/exceptions/product-not-found.exception';

describe('GetProductByIdUseCase', () => {
  it('retorna un producto existente', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(
        new ProductEntity({
          id: 'prod-1',
          name: 'Laptop',
          description: 'Demo',
          price: 1000,
          currency: 'COP',
          stock: 4,
          imageUrl: 'https://example.com/image.png',
          category: 'Electronics',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const useCase = new GetProductByIdUseCase(repository as never);
    const result = await useCase.execute('prod-1');

    expect(result.id).toBe('prod-1');
  });

  it('lanza error si el producto no existe', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    const useCase = new GetProductByIdUseCase(repository as never);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      ProductNotFoundException,
    );
  });
});
