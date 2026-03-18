import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() u: { userId: string }) {
    return this.prisma.userAddress.findMany({
      where: { userId: u.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  @Post()
  async create(
    @CurrentUser() u: { userId: string },
    @Body()
    body: {
      title: string;
      line1: string;
      line2?: string;
      city: string;
      district: string;
      postalCode?: string;
      isDefault?: boolean;
    },
  ) {
    if (body.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId: u.userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.userAddress.create({
      data: {
        userId: u.userId,
        title: body.title,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        district: body.district,
        postalCode: body.postalCode,
        isDefault: body.isDefault ?? false,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      line1: string;
      line2: string;
      city: string;
      district: string;
      postalCode: string;
      isDefault: boolean;
    }>,
  ) {
    const a = await this.prisma.userAddress.findFirst({
      where: { id, userId: u.userId },
    });
    if (!a) return null;
    if (body.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId: u.userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.userAddress.update({
      where: { id },
      data: body,
    });
  }

  @Delete(':id')
  async remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    await this.prisma.userAddress.deleteMany({
      where: { id, userId: u.userId },
    });
    return { ok: true };
  }
}
