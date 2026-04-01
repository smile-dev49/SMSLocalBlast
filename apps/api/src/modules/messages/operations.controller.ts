import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { QuotaEnforcementService } from '../billing/quota-enforcement.service';
import {
  OperationsListQuerySchema,
  type OperationsListQuery,
} from './dto/operations-list.query.dto';
import { OperationsService } from './operations.service';

@ApiTags('Operations')
@ApiBearerAuth('access-token')
@Controller({ path: 'operations', version: '1' })
export class OperationsController {
  constructor(
    private readonly operations: OperationsService,
    private readonly quota: QuotaEnforcementService,
  ) {}

  private async assertOpsEntitlement(user: AuthPrincipal): Promise<void> {
    if (!user.organizationId) return;
    await this.quota.assertFeatureEnabled(user.organizationId, 'operations.read');
  }

  @Permissions('operations.read')
  @Get('queues/summary')
  @ApiOperation({ summary: 'Queue-oriented outbound message summary' })
  async queueSummary(@CurrentUser() user: AuthPrincipal) {
    await this.assertOpsEntitlement(user);
    return this.operations.queueSummary();
  }

  @Permissions('operations.read')
  @Get('queues/lag')
  @ApiOperation({ summary: 'Bull queue lag and counts' })
  async queueLag(@CurrentUser() user: AuthPrincipal) {
    await this.assertOpsEntitlement(user);
    return this.operations.queueLag();
  }

  @Permissions('operations.read')
  @Get('messages/stuck')
  async stuckMessages(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(OperationsListQuerySchema)) query: OperationsListQuery,
  ) {
    await this.assertOpsEntitlement(user);
    return this.operations.stuckMessages(query.limit);
  }

  @Permissions('operations.read')
  @Get('messages/dead-letter')
  @ApiOperation({ summary: 'Messages moved to dead-letter policy' })
  async deadLetterMessages(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(OperationsListQuerySchema)) query: OperationsListQuery,
  ) {
    await this.assertOpsEntitlement(user);
    return this.operations.deadLetterMessages(query.limit);
  }

  @Permissions('operations.read')
  @Get('campaigns/processing')
  @ApiOperation({ summary: 'Campaigns currently processing' })
  async campaignsProcessing(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(OperationsListQuerySchema)) query: OperationsListQuery,
  ) {
    await this.assertOpsEntitlement(user);
    return this.operations.campaignsProcessing(query.limit);
  }

  @Permissions('operations.read')
  @Get('devices/availability')
  async devicesAvailability(@CurrentUser() user: AuthPrincipal) {
    await this.assertOpsEntitlement(user);
    return this.operations.devicesAvailability();
  }

  @Permissions('operations.write')
  @Post('messages/recover-stuck')
  @ApiOperation({ summary: 'Run one recovery sweep for stuck/retry-overdue messages' })
  async recoverStuckMessages(@CurrentUser() user: AuthPrincipal) {
    await this.assertOpsEntitlement(user);
    return this.operations.recoverStuckMessages();
  }

  @Permissions('operations.write')
  @Post('campaigns/reconcile')
  @ApiOperation({ summary: 'Finalize processing campaigns if all messages are terminal' })
  async reconcileCampaigns(@CurrentUser() user: AuthPrincipal) {
    await this.assertOpsEntitlement(user);
    const finalized = await this.operations.reconcileProcessingCampaigns();
    return { finalized };
  }
}
