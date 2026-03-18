import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private prisma: PrismaService,
  ) {}

  @Post()
  create(
    @CurrentUser() u: { userId: string },
    @Headers('idempotency-key') idem: string | undefined,
    @Body()
    body: {
      addressId: string;
      couponCode?: string | null;
      clientRequestId?: string;
    },
  ) {
    const key = idem || body.clientRequestId;
    return this.orders.createOrder(
      u.userId,
      body.addressId,
      body.couponCode,
      key,
    );
  }

  @Get()
  async list(
    @CurrentUser() u: { userId: string },
    @Query('cursor') cursor?: string,
  ) {
    const orders = await this.prisma.order.findMany({
      where: { userId: u.userId },
      orderBy: { createdAt: 'desc' },
      take: 21,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
    });
    const hasMore = orders.length > 20;
    const items = hasMore ? orders.slice(0, 20) : orders;
    return {
      items: items.map((o) => this.orders.mapOrder(o)),
      nextCursor: hasMore ? items[19]?.id : null,
    };
  }

  @Get(':id')
  async one(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    const o = await this.prisma.order.findFirst({
      where: { id, userId: u.userId },
      include: {
        items: true,
      },
    });
    if (!o) return null;
    return {
      ...this.orders.mapOrder(o),
      items: o.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productNameSnapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unitPriceSnapshot),
      })),
    };
  }
}
