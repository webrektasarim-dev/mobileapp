import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() u: { userId: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: u.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        locale: true,
        pushEnabled: true,
      },
    });
    return user;
  }

  @Patch('me')
  async patchMe(
    @CurrentUser() u: { userId: string },
    @Body() body: { name?: string; phone?: string; locale?: string },
  ) {
    return this.prisma.user.update({
      where: { id: u.userId },
      data: {
        name: body.name,
        phone: body.phone,
        locale: body.locale,
      },
      select: { id: true, email: true, name: true, phone: true, locale: true },
    });
  }

  @Patch('me/preferences')
  async preferences(
    @CurrentUser() u: { userId: string },
    @Body() body: { pushEnabled?: boolean },
  ) {
    return this.prisma.user.update({
      where: { id: u.userId },
      data: { pushEnabled: body.pushEnabled },
      select: { pushEnabled: true },
    });
  }

  @Post('me/device')
  async device(
    @CurrentUser() u: { userId: string },
    @Body() body: { fcmToken: string; platform: string },
  ) {
    await this.prisma.userDevice.upsert({
      where: {
        userId_fcmToken: { userId: u.userId, fcmToken: body.fcmToken },
      },
      create: {
        userId: u.userId,
        fcmToken: body.fcmToken,
        platform: body.platform,
      },
      update: { platform: body.platform },
    });
    return { ok: true };
  }
}
