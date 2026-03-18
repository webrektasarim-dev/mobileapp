import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from '../cart/cart.service';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(
    private prisma: PrismaService,
    private cart: CartService,
  ) {}

  @Post('validate')
  async validate(
    @CurrentUser() u: { userId: string },
    @Body() body: { code: string },
  ) {
    const cartRow = await this.cart.getOrCreateCart(u.userId);
    const cart = await this.cart.buildCartResponse(cartRow.id);
    const subtotal = cart.subtotal;
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: body.code.toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      return { valid: false, discountAmount: 0, message: 'Geçersiz kupon' };
    }
    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now)
      return { valid: false, discountAmount: 0, message: 'Kupon henüz geçerli değil' };
    if (coupon.validTo && coupon.validTo < now)
      return { valid: false, discountAmount: 0, message: 'Kupon süresi dolmuş' };
    if (coupon.minCart && Number(coupon.minCart) > subtotal) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Minimum sepet tutarı sağlanmadı',
      };
    }
    if (coupon.maxUses != null) {
      const used = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (used >= coupon.maxUses) {
        return { valid: false, discountAmount: 0, message: 'Kupon kullanım limiti doldu' };
      }
    }
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = subtotal * (Number(coupon.value) / 100);
    } else {
      discount = Number(coupon.value);
    }
    discount = Math.min(discount, subtotal);
    return { valid: true, discountAmount: discount, message: 'OK' };
  }
}
