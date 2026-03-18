import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() u: { userId: string }) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId: u.userId },
      include: {
        product: {
          include: {
            variants: { orderBy: { price: 'asc' }, take: 1 },
            images: { take: 1 },
          },
        },
      },
    });
    return favs.map((f) => ({
      id: f.product.id,
      name: f.product.name,
      slug: f.product.slug,
      thumbnailUrl: f.product.images[0]?.url ?? null,
      minPrice: f.product.variants[0]?.price ?? 0,
      currency: 'TRY',
    }));
  }

  @Post()
  add(
    @CurrentUser() u: { userId: string },
    @Body() body: { productId: string },
  ) {
    return this.prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: u.userId,
          productId: body.productId,
        },
      },
      create: { userId: u.userId, productId: body.productId },
      update: {},
    });
  }

  @Delete()
  remove(
    @CurrentUser() u: { userId: string },
    @Query('productId') productId: string,
  ) {
    return this.prisma.favorite.deleteMany({
      where: { userId: u.userId, productId },
    });
  }
}
