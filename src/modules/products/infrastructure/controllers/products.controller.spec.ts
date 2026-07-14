import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  const requestMock = {
    protocol: 'https',
    get: jest.fn((name: string) => (name === 'host' ? 'payment.ondeploy.online' : undefined)),
    headers: {},
  };

  it('lista productos usando el use-case', async () => {
    const getProductsUseCase = {
      execute: jest.fn().mockResolvedValue([{ id: 'prod-1', imageUrl: 'demo.png' }]),
    };
    const getProductByIdUseCase = {
      execute: jest.fn(),
    };

    const controller = new ProductsController(
      getProductsUseCase as never,
      getProductByIdUseCase as never,
    );

    const result = await controller.getProducts(requestMock as never);

    expect(getProductsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 'prod-1',
        imageUrl: 'https://payment.ondeploy.online/imagenes/demo.png',
      },
    ]);
  });

  it('consulta producto por id usando el use-case', async () => {
    const getProductsUseCase = {
      execute: jest.fn(),
    };
    const getProductByIdUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'prod-9', imageUrl: 'demo.png' }),
    };

    const controller = new ProductsController(
      getProductsUseCase as never,
      getProductByIdUseCase as never,
    );

    const result = await controller.getProductById('prod-9', requestMock as never);

    expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('prod-9');
    expect(result).toEqual({
      id: 'prod-9',
      imageUrl: 'https://payment.ondeploy.online/imagenes/demo.png',
    });
  });
});
