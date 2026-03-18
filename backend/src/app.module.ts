import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HomeModule } from './home/home.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { FavoritesModule } from './favorites/favorites.module';

const redisDisabled =
  process.env.REDIS_DISABLED === 'true' ||
  process.env.REDIS_DISABLED === '1' ||
  process.env.BULLMQ_DISABLED === 'true';

const bullImports = redisDisabled
  ? []
  : [
      BullModule.forRoot({
        connection: {
          host: process.env.REDIS_HOST ?? '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
      }),
    ];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    ...bullImports,
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    HomeModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    AddressesModule,
    CouponsModule,
    OrdersModule,
    NotificationsModule,
    PaymentsModule.register({ enableBull: !redisDisabled }),
    AdminModule,
    FavoritesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
