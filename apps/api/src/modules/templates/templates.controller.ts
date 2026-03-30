import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller({ path: 'templates', version: '1' })
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}
}
