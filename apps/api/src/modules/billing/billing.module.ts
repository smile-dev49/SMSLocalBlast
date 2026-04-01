import { Global, Module } from '@nestjs/common';
import { BillingAccessService } from './billing-access.service';
import { BillingWebhookService } from './billing-webhook.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementsService } from './entitlements.service';
import { QuotaEnforcementService } from './quota-enforcement.service';
import { StripeService } from './stripe.service';
import { UsageCountersService } from './usage-counters.service';

@Global()
@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    StripeService,
    BillingWebhookService,
    EntitlementsService,
    UsageCountersService,
    QuotaEnforcementService,
    BillingAccessService,
  ],
  exports: [
    BillingService,
    EntitlementsService,
    UsageCountersService,
    QuotaEnforcementService,
    BillingAccessService,
  ],
})
export class BillingModule {}
