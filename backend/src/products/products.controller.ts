import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('products')
export class ProductsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query('categoryId') categoryId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
    @Query('sort') sort?: string,
  ) {
    const limit = Math.min(parseInt(limitStr ?? '20', 10) || 20, 50);
    let cursorId: string | undefined;
    if (cursor) {
      try {
        const o = JSON.parse(
          Buffer.from(cursor, 'base64url').toString('utf8'),
        ) as { id: string };
        cursorId = o.id;
      } catch {
        cursorId = undefined;
      }
    }
    const where: Record<string, unknown> = {
      status: 'active',
      deletedAt: null,
    };
    if (categoryId) where.categoryId = categoryId;

    const orderBy =
      sort === 'newest' || !sort
        ? [{ createdAt: 'desc' as const }, { id: 'desc' as const }]
        : [{ id: 'asc' as const }];

    const products = await this.prisma.product.findMany({
      where,
      take: limit + 1,
      ...(cursorId
        ? {
            skip: 1,
            cursor: { id: cursorId },
          }
        : {}),
      orderBy:
        sort === 'price_asc' || sort === 'price_desc'
          ? { id: 'asc' }
          : { createdAt: 'desc' },
      include: {
        variants: { orderBy: { price: 'asc' }, take: 1 },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    let list = products;
    if (sort === 'price_asc') {
      list = [...products].sort(
        (a, b) =>
          Number(a.variants[0]?.price ?? 0) - Number(b.variants[0]?.price ?? 0),
      );
    } else if (sort === 'price_desc') {
      list = [...products].sort(
        (a, b) =>
          Number(b.variants[0]?.price ?? 0) - Number(a.variants[0]?.price ?? 0),
      );
    }

    const hasMore = list.length > limit;
    const items = hasMore ? list.slice(0, limit) : list;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? Buffer.from(JSON.stringify({ id: last.id })).toString('base64url')
        : null;

    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        thumbnailUrl: p.images[0]?.url ?? null,
        minPrice: p.variants[0]?.price ?? 0,
        currency: 'TRY',
      })),
      nextCursor,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, status: 'active', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });
    if (!p) throw new NotFoundException();
    const min = p.variants.reduce(
      (m, v) => Math.min(m, Number(v.price)),
      Infinity,
    );
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      thumbnailUrl: p.images[0]?.url ?? null,
      minPrice: min === Infinity ? 0 : min,
      currency: 'TRY',
      description: p.description,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes,
      })),
    };
  }
}
