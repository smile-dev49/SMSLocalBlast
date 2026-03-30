import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly billingService: BillingService) {}
}
