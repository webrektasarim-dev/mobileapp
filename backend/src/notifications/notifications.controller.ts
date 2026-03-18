import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() u: { userId: string },
    @Query('cursor') cursor?: string,
  ) {
    const items = await this.prisma.notification.findMany({
      where: { userId: u.userId },
      orderBy: { createdAt: 'desc' },
      take: 21,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const hasMore = items.length > 20;
    const slice = hasMore ? items.slice(0, 20) : items;
    return {
      items: slice.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? slice[19]?.id : null,
    };
  }

  @Patch(':id/read')
  async read(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId: u.userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
