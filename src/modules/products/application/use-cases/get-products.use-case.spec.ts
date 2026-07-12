import { GetProductsUseCase } from './get-products.use-case';
import { ProductEntity } from '../../domain/entities/product.entity';

describe('GetProductsUseCase', () => {
  it('retorna la lista de productos', async () => {
    const repository = {
      findAll: jest.fn().mockResolvedValue([
        new ProductEntity({
          id: 'prod-1',
          name: 'Laptop',
          description: 'Demo',
          price: 1000,
          currency: 'COP',
          stock: 4,
          imageUrl: 'https://example.com/image.png',
          category: 'Electronics',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]),
    };

    const useCase = new GetProductsUseCase(repository as never);
    const result = await useCase.execute();

    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('prod-1');
  });
});
