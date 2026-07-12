import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.deliveryRecord.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: 'Laptop Pro 15"',
        description: 'Portatil de alto rendimiento para trabajo y contenido.',
        price: 350000000,
        currency: 'COP',
        stock: 10,
        imageUrl:
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20premium%20silver%20laptop%20on%20clean%20studio%20background%2C%20ecommerce%20product%20photo%2C%20soft%20shadows&image_size=landscape_4_3',
        category: 'Electronics',
      },
      {
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalambricos con cancelacion de ruido.',
        price: 15000000,
        currency: 'COP',
        stock: 25,
        imageUrl:
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20wireless%20headphones%20product%20photo%20on%20neutral%20background%2C%20modern%20ecommerce%20style&image_size=square_hd',
        category: 'Electronics',
      },
      {
        name: 'Teclado Mecanico',
        description: 'Teclado mecanico para productividad y gaming.',
        price: 12000000,
        currency: 'COP',
        stock: 15,
        imageUrl:
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20mechanical%20keyboard%20product%20shot%20on%20clean%20white%20background%2C%20ecommerce%20lighting&image_size=landscape_4_3',
        category: 'Peripherals',
      },
      {
        name: 'Mouse Ergonomico',
        description: 'Mouse ergonomico inalambrico para uso diario.',
        price: 8000000,
        currency: 'COP',
        stock: 30,
        imageUrl:
          'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20ergonomic%20wireless%20mouse%20product%20photo%20on%20minimal%20background%2C%20ecommerce%20style&image_size=square_hd',
        category: 'Peripherals',
      },
    ],
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
