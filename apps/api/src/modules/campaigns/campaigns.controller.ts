import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@Controller({ path: 'campaigns', version: '1' })
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
}
