import { DynamicModule, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentsService } from './payments.service';
import { PaymentsWebhookController } from './payments.controller';
import { PaymentReconcileProcessor } from './payment-reconcile.processor';

@Injectable()
class PaymentsBullScheduler implements OnModuleInit {
  constructor(@InjectQueue('payments') private paymentsQueue: Queue) {}

  async onModuleInit() {
    await this.paymentsQueue.add(
      'reconcile',
      { type: 'cron' },
      {
        repeat: { every: 120_000 },
        jobId: 'payment-reconcile-repeat',
      },
    );
  }
}

@Module({})
export class PaymentsModule {
  static register(opts: { enableBull: boolean }): DynamicModule {
    if (opts.enableBull) {
      return {
        module: PaymentsModule,
        imports: [BullModule.registerQueue({ name: 'payments' })],
        controllers: [PaymentsWebhookController],
        providers: [
          PaymentsService,
          PaymentReconcileProcessor,
          PaymentsBullScheduler,
        ],
        exports: [PaymentsService],
      };
    }
    return {
      module: PaymentsModule,
      controllers: [PaymentsWebhookController],
      providers: [PaymentsService],
      exports: [PaymentsService],
    };
  }
}
