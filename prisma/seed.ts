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
        imageUrl: 'laptop_pro_15.png',
        category: 'Electronics',
      },
      {
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalambricos con cancelacion de ruido.',
        price: 15000000,
        currency: 'COP',
        stock: 25,
        imageUrl: 'auriculares_bluetooth.png',
        category: 'Electronics',
      },
      {
        name: 'Teclado Mecanico',
        description: 'Teclado mecanico para productividad y gaming.',
        price: 12000000,
        currency: 'COP',
        stock: 15,
        imageUrl: 'teclado_mecanico.png',
        category: 'Peripherals',
      },
      {
        name: 'Mouse Ergonomico',
        description: 'Mouse ergonomico inalambrico para uso diario.',
        price: 8000000,
        currency: 'COP',
        stock: 30,
        imageUrl: 'mouse_ergonomico.png',
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
