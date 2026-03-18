import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthService } from './admin.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { AuditService } from '../audit/audit.service';
import { OrderStatus } from '@prisma/client';

@Controller('admin')
export class AdminPublicController {
  constructor(private adminAuth: AdminAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.adminAuth.login(body.email, body.password);
  }
}

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminProtectedController {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  @Get('products')
  products(@Query('skip') skip = '0', @Query('take') take = '20') {
    return this.prisma.product.findMany({
      skip: parseInt(skip, 10) || 0,
      take: Math.min(parseInt(take, 10) || 20, 100),
      include: { variants: true, category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post('products')
  async createProduct(
    @Req() req: Request & { user?: { adminId: string } },
    @Body()
    body: {
      categoryId: string;
      name: string;
      slug: string;
      description?: string;
      variants: { sku: string; price: number; stock: number }[];
    },
  ) {
    const p = await this.prisma.product.create({
      data: {
        categoryId: body.categoryId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        variants: {
          create: body.variants.map((v) => ({
            sku: v.sku,
            price: v.price,
            stock: v.stock,
          })),
        },
      },
    });
    await this.audit.log(
      req.user?.adminId ?? null,
      'product.create',
      'product',
      p.id,
      { slug: body.slug },
      req.ip,
    );
    return p;
  }

  @Get('orders')
  orders(@Query('status') status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as OrderStatus } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, name: true } } },
    });
  }

  @Patch('orders/:id/status')
  async orderStatus(
    @Req() req: Request & { user?: { adminId: string } },
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    const o = await this.prisma.order.update({
      where: { id },
      data: { status: body.status },
    });
    await this.audit.log(
      req.user?.adminId ?? null,
      'order.status',
      'order',
      id,
      { status: body.status },
      req.ip,
    );
    return o;
  }

  @Get('banners')
  banners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Post('banners')
  async createBanner(
    @Req() req: Request & { user?: { adminId: string } },
    @Body()
    body: {
      imageUrl: string;
      link?: string;
      sortOrder?: number;
      locale?: string;
    },
  ) {
    const b = await this.prisma.banner.create({
      data: {
        imageUrl: body.imageUrl,
        link: body.link,
        sortOrder: body.sortOrder ?? 0,
        locale: body.locale ?? 'tr',
      },
    });
    await this.audit.log(
      req.user?.adminId ?? null,
      'banner.create',
      'banner',
      b.id,
      {},
      req.ip,
    );
    return b;
  }

  @Get('coupons')
  coupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('coupons')
  async createCoupon(
    @Req() req: Request & { user?: { adminId: string } },
    @Body()
    body: {
      code: string;
      type: string;
      value: number;
      minCart?: number;
      maxUses?: number;
    },
  ) {
    const c = await this.prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.value,
        minCart: body.minCart,
        maxUses: body.maxUses,
      },
    });
    await this.audit.log(
      req.user?.adminId ?? null,
      'coupon.create',
      'coupon',
      c.id,
      { code: c.code },
      req.ip,
    );
    return c;
  }

  @Get('activity-logs')
  activityLogs(@Query('take') take = '50') {
    return this.prisma.activityLog.findMany({
      take: Math.min(parseInt(take, 10) || 50, 200),
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { email: true } } },
    });
  }
}
