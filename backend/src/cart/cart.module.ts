import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, OptionalJwtGuard],
  exports: [CartService],
})
export class CartModule {}
