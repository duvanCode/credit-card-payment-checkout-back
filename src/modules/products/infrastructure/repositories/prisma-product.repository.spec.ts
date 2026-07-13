import { PrismaProductRepository } from './prisma-product.repository';

describe('PrismaProductRepository', () => {
  const product = {
    id: 'prod-1',
    name: 'Laptop',
    description: 'desc',
    price: 1000,
    currency: 'COP',
    stock: 3,
    imageUrl: 'http://localhost/img.png',
    category: 'Electronics',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('findAll mapea entidades', async () => {
    const prismaService = {
      product: {
        findMany: jest.fn().mockResolvedValue([product]),
      },
    };

    const repo = new PrismaProductRepository(prismaService as never);
    const result = await repo.findAll();

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].toPrimitives()).toEqual(expect.objectContaining({ id: 'prod-1' }));
  });

  it('findById retorna null si no existe', async () => {
    const prismaService = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const repo = new PrismaProductRepository(prismaService as never);
    const result = await repo.findById('missing');

    expect(result).toBeNull();
  });

  it('findById retorna entidad si existe', async () => {
    const prismaService = {
      product: {
        findUnique: jest.fn().mockResolvedValue(product),
      },
    };

    const repo = new PrismaProductRepository(prismaService as never);
    const result = await repo.findById('prod-1');

    expect(result?.toPrimitives().id).toBe('prod-1');
  });

  it('decrementStock actualiza stock', async () => {
    const prismaService = {
      product: {
        update: jest.fn().mockResolvedValue({ ...product, stock: 1 }),
      },
    };

    const repo = new PrismaProductRepository(prismaService as never);
    const result = await repo.decrementStock('prod-1', 2);

    expect(prismaService.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: { decrement: 2 } },
    });
    expect(result.toPrimitives().stock).toBe(1);
  });
});
