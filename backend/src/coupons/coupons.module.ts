import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { CouponsController } from './coupons.controller';

@Module({
  imports: [CartModule],
  controllers: [CouponsController],
})
export class CouponsModule {}
