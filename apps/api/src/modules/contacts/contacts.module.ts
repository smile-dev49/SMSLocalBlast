import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';
import { ContactsNormalizationService } from './contacts-normalization.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactsListsService } from './contacts-lists.service';

@Module({
  controllers: [ContactsController],
  providers: [
    ContactsService,
    ContactsRepository,
    ContactsNormalizationService,
    ContactsImportService,
    ContactsListsService,
  ],
  exports: [ContactsService],
})
export class ContactsModule {}
