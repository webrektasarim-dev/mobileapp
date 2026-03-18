import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    adminId: string | null,
    action: string,
    entity: string,
    entityId: string | null,
    meta?: Record<string, unknown>,
    ip?: string,
  ) {
    await this.prisma.activityLog.create({
      data: {
        adminId: adminId ?? undefined,
        action,
        entity,
        entityId: entityId ?? undefined,
        meta: meta ? (meta as object) : undefined,
        ip,
      },
    });
  }
}
