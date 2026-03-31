import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { CampaignPreviewBodySchema, type CampaignPreviewBody } from './dto/campaign-preview.dto';
import { CampaignScheduleBodySchema, type CampaignScheduleBody } from './dto/campaign-schedule.dto';
import { CampaignIdParamSchema } from './dto/campaign-id.schema';
import { CreateCampaignBodySchema, type CreateCampaignBody } from './dto/create-campaign.dto';
import { ListCampaignsQuerySchema, type ListCampaignsQuery } from './dto/list-campaigns.query.dto';
import { UpdateCampaignBodySchema, type UpdateCampaignBody } from './dto/update-campaign.dto';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@ApiBearerAuth('access-token')
@Controller({ path: 'campaigns', version: '1' })
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Permissions('campaigns.preview')
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview recipients and rendering without persisting' })
  preview(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CampaignPreviewBodySchema)) body: CampaignPreviewBody,
  ) {
    return this.campaignsService.preview(user, body);
  }

  @Permissions('campaigns.write')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create campaign with recipient snapshots' })
  createCampaign(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateCampaignBodySchema)) body: CreateCampaignBody,
  ) {
    return this.campaignsService.createCampaign(user, body);
  }

  @Permissions('campaigns.read')
  @Get()
  @ApiOperation({ summary: 'List campaigns (paginated, organization-scoped)' })
  listCampaigns(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListCampaignsQuerySchema)) query: ListCampaignsQuery,
  ) {
    return this.campaignsService.listCampaigns(user, query);
  }

  @Permissions('campaigns.read')
  @Get(':campaignId/summary')
  @ApiOperation({ summary: 'Campaign summary with recipient status distribution' })
  getSummary(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.getCampaignSummary(user, campaignId);
  }

  @Permissions('campaigns.read')
  @Get(':campaignId/events')
  @ApiOperation({ summary: 'Recent campaign execution events (polling endpoint)' })
  getEvents(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.getCampaignEvents(user, campaignId);
  }

  @Permissions('campaigns.execute')
  @Post(':campaignId/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule campaign (future scheduledAt)' })
  schedule(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
    @Body(new ZodValidationPipe(CampaignScheduleBodySchema)) body: CampaignScheduleBody,
  ) {
    return this.campaignsService.scheduleCampaign(user, campaignId, body);
  }

  @Permissions('campaigns.execute')
  @Post(':campaignId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start campaign (PROCESSING + refresh snapshots)' })
  start(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.startCampaign(user, campaignId);
  }

  @Permissions('campaigns.execute')
  @Post(':campaignId/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause campaign' })
  pause(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.pauseCampaign(user, campaignId);
  }

  @Permissions('campaigns.execute')
  @Post(':campaignId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel campaign and outstanding recipients' })
  cancel(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.cancelCampaign(user, campaignId);
  }

  @Permissions('campaigns.read')
  @Get(':campaignId')
  @ApiOperation({ summary: 'Get one campaign' })
  getCampaign(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ) {
    return this.campaignsService.getCampaign(user, campaignId);
  }

  @Permissions('campaigns.write')
  @Patch(':campaignId')
  @ApiOperation({ summary: 'Update campaign (may rebuild snapshots in draft-like states)' })
  updateCampaign(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
    @Body(new ZodValidationPipe(UpdateCampaignBodySchema)) body: UpdateCampaignBody,
  ) {
    return this.campaignsService.updateCampaign(user, campaignId, body);
  }

  @Permissions('campaigns.write')
  @Delete(':campaignId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete campaign' })
  deleteCampaign(
    @CurrentUser() user: AuthPrincipal,
    @Param('campaignId', new ZodValidationPipe(CampaignIdParamSchema)) campaignId: string,
  ): Promise<void> {
    return this.campaignsService.deleteCampaign(user, campaignId);
  }
}
