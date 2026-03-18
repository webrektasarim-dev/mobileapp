import { Body, Controller, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';

@SkipThrottle()
@Controller('webhooks')
export class PaymentsWebhookController {
  constructor(private payments: PaymentsService) {}

  @Post('payments/:provider')
  webhook(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.payments.handleWebhook(provider, body);
  }
}
