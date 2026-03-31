import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplatesRepository } from './templates.repository';
import { TemplateRendererService } from './template-renderer.service';
import { TemplateVariableService } from './template-variable.service';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [ContactsModule],
  controllers: [TemplatesController],
  providers: [
    TemplatesService,
    TemplatesRepository,
    TemplateRendererService,
    TemplateVariableService,
  ],
  exports: [
    TemplatesService,
    TemplatesRepository,
    TemplateRendererService,
    TemplateVariableService,
  ],
})
export class TemplatesModule {}
