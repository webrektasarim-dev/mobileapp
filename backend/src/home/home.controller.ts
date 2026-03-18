import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('home')
export class HomeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async home(@Query('locale') locale = 'tr') {
    const banners = await this.prisma.banner.findMany({
      where: { active: true, locale },
      orderBy: { sortOrder: 'asc' },
      take: 20,
    });
    const featuredCategories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      take: 8,
    });
    const featuredProducts = await this.prisma.product.findMany({
      where: { status: 'active', deletedAt: null },
      take: 8,
      include: {
        variants: { orderBy: { price: 'asc' }, take: 1 },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
    return {
      banners: banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        link: b.link,
        sortOrder: b.sortOrder,
      })),
      featuredCategories: featuredCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
      })),
      featuredProducts: featuredProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        thumbnailUrl: p.images[0]?.url ?? null,
        minPrice: p.variants[0]?.price ?? 0,
        currency: 'TRY',
      })),
    };
  }
}
