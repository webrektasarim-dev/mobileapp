import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId?: string, guestToken?: string) {
    if (userId) {
      let c = await this.prisma.cart.findFirst({ where: { userId } });
      if (!c) {
        c = await this.prisma.cart.create({ data: { userId } });
      }
      return c;
    }
    if (guestToken) {
      let c = await this.prisma.cart.findUnique({
        where: { guestToken },
      });
      if (!c) {
        c = await this.prisma.cart.create({ data: { guestToken } });
      }
      return c;
    }
    const token = randomBytes(16).toString('hex');
    return this.prisma.cart.create({ data: { guestToken: token } });
  }

  async mergeGuestIntoUser(userId: string, guestToken: string) {
    const userCart = await this.getOrCreateCart(userId);
    const guest = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: { items: true },
    });
    if (!guest || guest.items.length === 0) {
      return this.buildCartResponse(userCart.id);
    }
    for (const it of guest.items) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: it.variantId,
          },
        },
        create: {
          cartId: userCart.id,
          variantId: it.variantId,
          quantity: it.quantity,
        },
        update: { quantity: { increment: it.quantity } },
      });
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: guest.id } });
    await this.prisma.cart.delete({ where: { id: guest.id } }).catch(() => undefined);
    return this.buildCartResponse(userCart.id);
  }

  async setItems(
    cartId: string,
    items: { variantId: string; quantity: number }[],
  ) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    for (const it of items) {
      if (it.quantity <= 0) continue;
      await this.prisma.cartItem.create({
        data: {
          cartId,
          variantId: it.variantId,
          quantity: it.quantity,
        },
      });
    }
    return this.buildCartResponse(cartId);
  }

  async buildCartResponse(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });
    if (!cart) return { guestToken: null, items: [], subtotal: 0, currency: 'TRY' };
    let subtotal = 0;
    const lines = cart.items.map((ci) => {
      const price = Number(ci.variant.price);
      const line = price * ci.quantity;
      subtotal += line;
      return {
        variantId: ci.variantId,
        quantity: ci.quantity,
        productName: ci.variant.product.name,
        unitPrice: price,
        lineTotal: line,
      };
    });
    return {
      guestToken: cart.guestToken,
      items: lines,
      subtotal,
      currency: 'TRY',
    };
  }
}
