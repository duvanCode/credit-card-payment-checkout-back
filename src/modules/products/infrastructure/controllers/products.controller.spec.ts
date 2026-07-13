import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  it('lista productos usando el use-case', async () => {
    const getProductsUseCase = {
      execute: jest.fn().mockResolvedValue([{ id: 'prod-1' }]),
    };
    const getProductByIdUseCase = {
      execute: jest.fn(),
    };

    const controller = new ProductsController(
      getProductsUseCase as never,
      getProductByIdUseCase as never,
    );

    const result = await controller.getProducts();

    expect(getProductsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'prod-1' }]);
  });

  it('consulta producto por id usando el use-case', async () => {
    const getProductsUseCase = {
      execute: jest.fn(),
    };
    const getProductByIdUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'prod-9' }),
    };

    const controller = new ProductsController(
      getProductsUseCase as never,
      getProductByIdUseCase as never,
    );

    const result = await controller.getProductById('prod-9');

    expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('prod-9');
    expect(result).toEqual({ id: 'prod-9' });
  });
});

