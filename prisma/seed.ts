import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const backendPublicUrl = (
  process.env.BACKEND_PUBLIC_URL ??
  `http://localhost:${process.env.PORT ?? '3000'}`
).replace(/\/$/, '');

function getImageUrl(fileName: string) {
  return `${backendPublicUrl}/imagenes/${fileName}`;
}

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
        imageUrl: getImageUrl('laptop_pro_15.png'),
        category: 'Electronics',
      },
      {
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalambricos con cancelacion de ruido.',
        price: 15000000,
        currency: 'COP',
        stock: 25,
        imageUrl: getImageUrl('auriculares_bluetooth.png'),
        category: 'Electronics',
      },
      {
        name: 'Teclado Mecanico',
        description: 'Teclado mecanico para productividad y gaming.',
        price: 12000000,
        currency: 'COP',
        stock: 15,
        imageUrl: getImageUrl('teclado_mecanico.png'),
        category: 'Peripherals',
      },
      {
        name: 'Mouse Ergonomico',
        description: 'Mouse ergonomico inalambrico para uso diario.',
        price: 8000000,
        currency: 'COP',
        stock: 30,
        imageUrl: getImageUrl('mouse_ergonomico.png'),
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
