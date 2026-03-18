import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'admin',
    },
    update: {},
  });

  const cat = await prisma.category.upsert({
    where: { slug: 'ornek-kategori' },
    create: { name: 'Örnek Kategori', slug: 'ornek-kategori', sortOrder: 0 },
    update: {},
  });

  await prisma.product.upsert({
    where: { slug: 'ornek-urun' },
    create: {
      categoryId: cat.id,
      name: 'Örnek Ürün',
      slug: 'ornek-urun',
      description: 'V1 seed ürünü',
      status: 'active',
      variants: {
        create: [
          { sku: 'SKU-001', price: 99.9, stock: 100 },
          { sku: 'SKU-002', price: 149.9, stock: 50 },
        ],
      },
      images: {
        create: [
          {
            url: 'https://placehold.co/400x400/png?text=Product',
            sortOrder: 0,
          },
        ],
      },
    },
    update: {},
  });

  const bc = await prisma.banner.count();
  if (bc === 0) {
    await prisma.banner.create({
      data: {
        imageUrl: 'https://placehold.co/800x300/png?text=Banner+1',
        link: '/products',
        sortOrder: 0,
        locale: 'tr',
        active: true,
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    create: {
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      minCart: 50,
      maxUses: 1000,
      active: true,
    },
    update: {},
  });

  console.log('Seed OK: admin@example.com / admin123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
