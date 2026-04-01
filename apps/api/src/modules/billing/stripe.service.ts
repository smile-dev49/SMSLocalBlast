import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe;
  readonly webhookSecret: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly billingPortalReturnUrl: string;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.getOrThrow<string>('billing.stripe.secretKey');
    this.webhookSecret = this.config.getOrThrow<string>('billing.stripe.webhookSecret');
    this.successUrl = this.config.getOrThrow<string>('billing.stripe.successUrl');
    this.cancelUrl = this.config.getOrThrow<string>('billing.stripe.cancelUrl');
    this.billingPortalReturnUrl = this.config.getOrThrow<string>(
      'billing.stripe.billingPortalReturnUrl',
    );
    this.client = new Stripe(secretKey);
  }
}
