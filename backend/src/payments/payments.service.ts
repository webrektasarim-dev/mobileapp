import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentRecordStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Shopier/POS webhook iskeleti: body içinde orderId, externalId, success beklenir.
   * Idempotency: aynı payloadHash veya externalId ikinci kez no-op.
   */
  async handleWebhook(
    provider: string,
    body: Record<string, unknown>,
  ): Promise<{ ok: boolean }> {
    const payloadHash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');

    const seen = await this.prisma.paymentEvent.findFirst({
      where: { provider, payloadHash, processed: true },
    });
    if (seen) return { ok: true };

    const orderId = String(body.orderId ?? body.order_id ?? '');
    const externalId = String(body.externalId ?? body.external_id ?? payloadHash);
    const success =
      body.success === true ||
      body.status === 'success' ||
      body.status === 'paid';

    if (!orderId) throw new BadRequestException('orderId required');

    const existingExt = await this.prisma.payment.findFirst({
      where: { externalId },
    });
    if (existingExt?.status === PaymentRecordStatus.completed) {
      return { ok: true };
    }

    await this.prisma.paymentEvent.create({
      data: {
        provider,
        payloadHash,
        rawBody: body as object,
        processed: success,
      },
    });

    if (!success) {
      await this.prisma.order.updateMany({
        where: { id: orderId },
        data: { paymentStatus: OrderPaymentStatus.failed },
      });
      return { ok: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          externalId,
          status: PaymentRecordStatus.completed,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.paid,
          paymentStatus: OrderPaymentStatus.paid,
        },
      });
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order?.couponId) {
        await tx.couponUsage.upsert({
          where: {
            couponId_orderId: {
              couponId: order.couponId,
              orderId: order.id,
            },
          },
          create: {
            couponId: order.couponId,
            userId: order.userId,
            orderId: order.id,
          },
          update: {},
        });
      }
    });

    return { ok: true };
  }

  /** Reconcile: uzun süredir pending_payment kalan siparişler (log + admin uyarı için). */
  async reconcileStaleOrders() {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const stale = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.pending_payment,
        createdAt: { lt: cutoff },
      },
      take: 50,
    });
    if (stale.length) {
      this.log.warn(
        `Reconcile: ${stale.length} pending_payment orders older than 15m: ${stale.map((o) => o.id).join(', ')}`,
      );
    }
    return { checked: stale.length };
  }
}
