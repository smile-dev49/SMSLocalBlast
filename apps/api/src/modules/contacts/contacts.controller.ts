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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { ContactsService } from './contacts.service';
import { ContactsListsService } from './contacts-lists.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactIdParamSchema } from './dto/contact-id.schema';
import { CreateContactBodySchema, type CreateContactBody } from './dto/create-contact.dto';
import { UpdateContactBodySchema, type UpdateContactBody } from './dto/update-contact.dto';
import { ListContactsQuerySchema, type ListContactsQuery } from './dto/list-contacts.query.dto';
import type { ContactResponse } from './types/contact.types';
import {
  UpsertContactCustomFieldsBodySchema,
  type UpsertContactCustomFieldsBody,
} from './dto/upsert-contact-custom-fields.dto';
import {
  CreateContactListBodySchema,
  type CreateContactListBody,
} from './dto/create-contact-list.dto';
import {
  UpdateContactListBodySchema,
  type UpdateContactListBody,
} from './dto/update-contact-list.dto';
import {
  ListContactListsQuerySchema,
  type ListContactListsQuery,
} from './dto/list-contact-lists.query.dto';
import { ContactListIdParamSchema } from './dto/list-id.schema';
import {
  AddContactsToListBodySchema,
  type AddContactsToListBody,
} from './dto/contact-list-members.dto';
import { ImportPreviewBodySchema } from './dto/import-preview.dto';
import { ImportConfirmBodySchema } from './dto/import-confirm.dto';
import type { ImportContactsBody } from './dto/import-contacts.dto';
import type {
  ContactListResponse,
  ImportConfirmResponse,
  ImportPreviewResponse,
} from './types/contact.types';

@ApiTags('Contacts')
@ApiBearerAuth('access-token')
@Controller({ version: '1' })
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly listsService: ContactsListsService,
    private readonly importService: ContactsImportService,
  ) {}

  @Permissions('contacts.write')
  @Post('contacts')
  @ApiOperation({ summary: 'Create contact' })
  async createContact(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateContactBodySchema)) body: CreateContactBody,
  ): Promise<ContactResponse> {
    return this.contactsService.createContact(user, body);
  }

  @Permissions('contacts.read')
  @Get('contacts')
  @ApiOperation({ summary: 'List contacts' })
  async listContacts(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListContactsQuerySchema)) query: ListContactsQuery,
  ): Promise<{
    readonly items: readonly ContactResponse[];
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  }> {
    return this.contactsService.listContacts(user, query);
  }

  @Permissions('contacts.read')
  @Get('contacts/:contactId')
  async getContact(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<ContactResponse> {
    return this.contactsService.getContact(user, contactId);
  }

  @Permissions('contacts.write')
  @Patch('contacts/:contactId')
  async updateContact(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
    @Body(new ZodValidationPipe(UpdateContactBodySchema)) body: UpdateContactBody,
  ): Promise<ContactResponse> {
    return this.contactsService.updateContact(user, contactId, body);
  }

  @Permissions('contacts.write')
  @Delete('contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContact(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<void> {
    await this.contactsService.deleteContact(user, contactId);
  }

  @Permissions('contacts.write')
  @Put('contacts/:contactId/custom-fields')
  async upsertCustomFields(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
    @Body(new ZodValidationPipe(UpsertContactCustomFieldsBodySchema))
    body: UpsertContactCustomFieldsBody,
  ): Promise<ContactResponse> {
    return this.contactsService.upsertCustomFields(user, contactId, body);
  }

  @Permissions('contacts.manage')
  @Post('contacts/:contactId/opt-out')
  async optOut(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<ContactResponse> {
    return this.contactsService.optOut(user, contactId);
  }

  @Permissions('contacts.manage')
  @Post('contacts/:contactId/block')
  async block(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<ContactResponse> {
    return this.contactsService.block(user, contactId);
  }

  @Permissions('contacts.manage')
  @Post('contacts/:contactId/unblock')
  async unblock(
    @CurrentUser() user: AuthPrincipal,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<ContactResponse> {
    return this.contactsService.unblock(user, contactId);
  }

  @Permissions('contact-lists.write')
  @Post('contact-lists')
  async createList(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateContactListBodySchema)) body: CreateContactListBody,
  ): Promise<ContactListResponse> {
    return this.listsService.createList(user, body);
  }

  @Permissions('contact-lists.read')
  @Get('contact-lists')
  async listLists(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListContactListsQuerySchema)) query: ListContactListsQuery,
  ): Promise<{
    readonly items: readonly ContactListResponse[];
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  }> {
    return this.listsService.listLists(user, query);
  }

  @Permissions('contact-lists.read')
  @Get('contact-lists/:listId')
  async getList(
    @CurrentUser() user: AuthPrincipal,
    @Param('listId', new ZodValidationPipe(ContactListIdParamSchema)) listId: string,
  ): Promise<ContactListResponse> {
    return this.listsService.getList(user, listId);
  }

  @Permissions('contact-lists.write')
  @Patch('contact-lists/:listId')
  async updateList(
    @CurrentUser() user: AuthPrincipal,
    @Param('listId', new ZodValidationPipe(ContactListIdParamSchema)) listId: string,
    @Body(new ZodValidationPipe(UpdateContactListBodySchema)) body: UpdateContactListBody,
  ): Promise<ContactListResponse> {
    return this.listsService.updateList(user, listId, body);
  }

  @Permissions('contact-lists.write')
  @Delete('contact-lists/:listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteList(
    @CurrentUser() user: AuthPrincipal,
    @Param('listId', new ZodValidationPipe(ContactListIdParamSchema)) listId: string,
  ): Promise<void> {
    await this.listsService.deleteList(user, listId);
  }

  @Permissions('contact-lists.write')
  @Post('contact-lists/:listId/contacts')
  async addContactsToList(
    @CurrentUser() user: AuthPrincipal,
    @Param('listId', new ZodValidationPipe(ContactListIdParamSchema)) listId: string,
    @Body(new ZodValidationPipe(AddContactsToListBodySchema)) body: AddContactsToListBody,
  ): Promise<{ added: number }> {
    return this.listsService.addContacts(user, listId, body);
  }

  @Permissions('contact-lists.write')
  @Delete('contact-lists/:listId/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContactFromList(
    @CurrentUser() user: AuthPrincipal,
    @Param('listId', new ZodValidationPipe(ContactListIdParamSchema)) listId: string,
    @Param('contactId', new ZodValidationPipe(ContactIdParamSchema)) contactId: string,
  ): Promise<void> {
    await this.listsService.removeContact(user, listId, contactId);
  }

  @Permissions('imports.contacts')
  @Post('contacts/import/preview')
  async importPreview(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(ImportPreviewBodySchema)) body: ImportContactsBody,
  ): Promise<ImportPreviewResponse> {
    return this.importService.previewImport(user, body);
  }

  @Permissions('imports.contacts')
  @Post('contacts/import/confirm')
  async importConfirm(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(ImportConfirmBodySchema)) body: ImportContactsBody,
  ): Promise<ImportConfirmResponse> {
    return this.importService.confirmImport(user, body);
  }
}
