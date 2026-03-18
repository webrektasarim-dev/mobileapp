import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminProtectedController,
  AdminPublicController,
} from './admin.controller';
import { AdminAuthService } from './admin.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminPublicController, AdminProtectedController],
  providers: [AdminAuthService],
})
export class AdminModule {}
