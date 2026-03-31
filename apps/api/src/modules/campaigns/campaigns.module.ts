import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { MessagesModule } from '../messages/messages.module';
import { TemplatesModule } from '../templates/templates.module';
import { CampaignPreviewService } from './campaign-preview.service';
import { CampaignRecipientsService } from './campaign-recipients.service';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { CampaignStateService } from './campaign-state.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [ContactsModule, TemplatesModule, MessagesModule],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignsRepository,
    CampaignStateService,
    CampaignSchedulerService,
    CampaignRecipientsService,
    CampaignPreviewService,
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
