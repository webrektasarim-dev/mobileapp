import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OrderStatus, OrderPaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cart: CartService,
  ) {}

  async createOrder(
    userId: string,
    addressId: string,
    couponCode: string | null | undefined,
    idempotencyKey: string | undefined,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: { payments: { take: 1, orderBy: { createdAt: 'desc' } } },
      });
      if (existing) {
        return {
          order: this.mapOrder(existing),
          payment: {
            redirectUrl:
              existing.payments[0]?.redirectUrl ??
              `https://pay.stub/order/${existing.id}`,
            provider: existing.payments[0]?.provider ?? 'stub',
          },
        };
      }
    }

    const addr = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!addr) throw new NotFoundException('Address not found');

    const cartRow = await this.cart.getOrCreateCart(userId);
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartRow.id },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!cart?.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = new Prisma.Decimal(0);
    const lines: {
      variantId: string;
      qty: number;
      unitPrice: Prisma.Decimal;
      productName: string;
    }[] = [];

    for (const ci of cart.items) {
      if (ci.variant.stock < ci.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${ci.variant.product.name}`,
        );
      }
      const unit = ci.variant.price;
      subtotal = subtotal.add(unit.mul(ci.quantity));
      lines.push({
        variantId: ci.variantId,
        qty: ci.quantity,
        unitPrice: unit,
        productName: ci.variant.product.name,
      });
    }

    let discount = new Prisma.Decimal(0);
    let couponId: string | undefined;
    if (couponCode) {
      const c = await this.prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (c?.active) {
        const now = new Date();
        const okDate =
          (!c.validFrom || c.validFrom <= now) &&
          (!c.validTo || c.validTo >= now);
        const okMin =
          !c.minCart || Number(c.minCart) <= Number(subtotal);
        if (okDate && okMin) {
          couponId = c.id;
          if (c.type === 'percent') {
            discount = subtotal.mul(Number(c.value)).div(100);
          } else {
            discount = new Prisma.Decimal(c.value);
          }
          if (discount.gt(subtotal)) discount = subtotal;
        }
      }
    }

    const total = subtotal.sub(discount);
    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          userId,
          addressId,
          status: OrderStatus.pending_payment,
          paymentStatus: OrderPaymentStatus.pending,
          total,
          idempotencyKey: idempotencyKey ?? undefined,
          couponId,
          discountAmount: discount,
        },
      });
      for (const l of lines) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            variantId: l.variantId,
            quantity: l.qty,
            unitPriceSnapshot: l.unitPrice,
            productNameSnapshot: l.productName,
          },
        });
        await tx.productVariant.update({
          where: { id: l.variantId },
          data: { stock: { decrement: l.qty } },
        });
      }
      const pay = await tx.payment.create({
        data: {
          orderId: o.id,
          provider: 'stub',
          amount: total,
          status: 'pending',
          redirectUrl: `https://pay.stub/checkout/${o.id}`,
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return { o, pay };
    });

    return {
      order: this.mapOrder(order.o),
      payment: {
        redirectUrl: order.pay.redirectUrl,
        provider: order.pay.provider,
      },
    };
  }

  mapOrder(o: {
    id: string;
    status: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    total: Prisma.Decimal;
    currency: string;
    createdAt: Date;
  }) {
    return {
      id: o.id,
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: Number(o.total),
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
    };
  }
}
