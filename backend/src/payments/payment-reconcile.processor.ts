import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Processor('payments')
export class PaymentReconcileProcessor extends WorkerHost {
  private readonly log = new Logger(PaymentReconcileProcessor.name);

  constructor(private payments: PaymentsService) {
    super();
  }

  async process(job: Job<{ type?: string }>): Promise<unknown> {
    if (job.name === 'reconcile') {
      const r = await this.payments.reconcileStaleOrders();
      this.log.debug(`reconcile job: ${JSON.stringify(r)}`);
      return r;
    }
    return { skipped: true };
  }
}
