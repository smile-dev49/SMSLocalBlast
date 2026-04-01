import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { BillingWebhookService } from './billing-webhook.service';
import { BillingService } from './billing.service';
import {
  CreateCheckoutSessionBodySchema,
  type CreateCheckoutSessionBody,
} from './dto/create-checkout-session.dto';
import { StripeService } from './stripe.service';

@ApiTags('Billing')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
    private readonly webhookService: BillingWebhookService,
  ) {}

  @Permissions('billing.read')
  @ApiBearerAuth('access-token')
  @Get('me')
  async me(@CurrentUser() principal: AuthPrincipal): Promise<Record<string, unknown>> {
    return this.billingService.getMyBilling(principal);
  }

  @Permissions('billing.read')
  @ApiBearerAuth('access-token')
  @Get('plans')
  async plans(): Promise<unknown> {
    return this.billingService.getPlans();
  }

  @Permissions('billing.write')
  @ApiBearerAuth('access-token')
  @Post('checkout-session')
  async checkoutSession(
    @CurrentUser() principal: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateCheckoutSessionBodySchema)) body: CreateCheckoutSessionBody,
  ): Promise<{ url: string | null; sessionId: string }> {
    return this.billingService.createCheckoutSession(principal, {
      ...(body.planCode ? { planCode: body.planCode } : {}),
      ...(body.priceId ? { priceId: body.priceId } : {}),
    });
  }

  @Permissions('billing.write')
  @ApiBearerAuth('access-token')
  @Post('portal-session')
  async portalSession(
    @CurrentUser() principal: AuthPrincipal,
  ): Promise<{ url: string; customerId: string }> {
    return this.billingService.createPortalSession(principal);
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!signature) return { received: true };
    const payload = request.body as Buffer;
    if (!Buffer.isBuffer(payload)) return { received: true };
    const event = this.stripeService.client.webhooks.constructEvent(
      payload,
      signature,
      this.stripeService.webhookSecret,
    );
    await this.webhookService.processStripeEvent(event);
    return { received: true };
  }
}
