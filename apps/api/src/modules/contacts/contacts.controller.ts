import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';

@ApiTags('Contacts')
@Controller({ path: 'contacts', version: '1' })
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}
}
