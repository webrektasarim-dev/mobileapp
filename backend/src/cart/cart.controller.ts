import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  async get(
    @Headers('guest-token') guestHeader: string | undefined,
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const u = req.user?.userId;
    const guest = guestHeader;
    const c = await this.cart.getOrCreateCart(u, guest);
    return this.cart.buildCartResponse(c.id);
  }

  @Put()
  @UseGuards(OptionalJwtGuard)
  async put(
    @Body() body: { items: { variantId: string; quantity: number }[] },
    @Headers('guest-token') guestHeader: string | undefined,
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const c = await this.cart.getOrCreateCart(req.user?.userId, guestHeader);
    return this.cart.setItems(c.id, body.items ?? []);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async merge(
    @CurrentUser() u: { userId: string },
    @Body() body: { guestToken: string },
  ) {
    return this.cart.mergeGuestIntoUser(u.userId, body.guestToken);
  }
}
