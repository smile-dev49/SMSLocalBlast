import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import { ContactsNormalizationService } from './contacts-normalization.service';
import { QuotaEnforcementService } from '../billing/quota-enforcement.service';
import { ContactsRepository, type ContactRow } from './contacts.repository';
import type { CreateContactBody } from './dto/create-contact.dto';
import type { ListContactsQuery } from './dto/list-contacts.query.dto';
import type { UpdateContactBody } from './dto/update-contact.dto';
import type { UpsertContactCustomFieldsBody } from './dto/upsert-contact-custom-fields.dto';
import {
  ContactAccessDeniedException,
  ContactNotFoundException,
  InvalidContactInputException,
} from './exceptions/contacts.exceptions';
import type { ContactResponse } from './types/contact.types';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: ContactsRepository,
    private readonly normalization: ContactsNormalizationService,
    private readonly audit: AuditLogService,
    private readonly quota: QuotaEnforcementService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  mergeFieldsFromContactRow(row: ContactRow): Record<string, string> {
    const mergeFields: Record<string, string> = {};
    if (row.firstName) mergeFields['FirstName'] = row.firstName;
    if (row.lastName) mergeFields['LastName'] = row.lastName;
    if (row.fullName) mergeFields['FullName'] = row.fullName;
    mergeFields['PhoneNumber'] = row.phoneNumber;
    mergeFields['NormalizedPhoneNumber'] = row.normalizedPhoneNumber;
    if (row.email) mergeFields['Email'] = row.email;
    for (const field of row.customFieldValues) {
      mergeFields[field.fieldKey] = field.fieldValue;
    }
    return mergeFields;
  }

  private mapContact(row: ContactRow): ContactResponse {
    const customFields = row.customFieldValues.map((f) => ({
      fieldKey: f.fieldKey,
      fieldValue: f.fieldValue,
      valueType: f.valueType,
    }));

    return {
      id: row.id,
      organizationId: row.organizationId,
      createdByUserId: row.createdByUserId,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      normalizedPhoneNumber: row.normalizedPhoneNumber,
      email: row.email,
      status: row.status,
      source: row.source,
      notes: row.notes,
      metadata: row.metadata,
      lastContactedAt: row.lastContactedAt,
      optedOutAt: row.optedOutAt,
      blockedAt: row.blockedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customFields,
      mergeFields: this.mergeFieldsFromContactRow(row),
    };
  }

  private async getOwnedContact(principal: AuthPrincipal, contactId: string): Promise<ContactRow> {
    const organizationId = this.orgId(principal);
    const row = await this.repo.findContactById(contactId);
    if (!row) throw new ContactNotFoundException();
    if (row.deletedAt !== null) throw new ContactNotFoundException();
    if (row.organizationId !== organizationId) throw new ContactAccessDeniedException();
    return row;
  }

  private async emitAudit(args: {
    readonly action: AuditAction;
    readonly organizationId: string;
    readonly actorUserId: string;
    readonly entityId: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const ctx = getRequestContext();
    await this.audit.emit({
      action: args.action,
      entityType: 'contact',
      entityId: args.entityId,
      organizationId: args.organizationId,
      actorUserId: args.actorUserId,
      ...(args.metadata ? { metadata: args.metadata } : {}),
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }

  async createContact(principal: AuthPrincipal, body: CreateContactBody): Promise<ContactResponse> {
    const organizationId = this.orgId(principal);
    const contactsCount = await this.prisma.contact.count({
      where: { organizationId, deletedAt: null },
    });
    await this.quota.assertBelowLimit({
      organizationId,
      entitlementCode: 'contacts.max',
      currentValue: contactsCount,
    });
    const normalized = this.normalization.normalizeContact({
      ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
      ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      phoneNumber: body.phoneNumber,
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    });

    const existing = await this.repo.findContactByNormalizedPhone({
      organizationId,
      normalizedPhoneNumber: normalized.normalizedPhoneNumber,
    });
    if (existing) {
      throw new InvalidContactInputException('A contact with this phone number already exists');
    }

    const row = await this.repo.createContact({
      organizationId,
      createdByUserId: principal.userId,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      fullName: normalized.fullName,
      phoneNumber: normalized.phoneNumber,
      normalizedPhoneNumber: normalized.normalizedPhoneNumber,
      email: normalized.email,
      notes: normalized.notes,
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as Prisma.InputJsonValue }
        : {}),
      source: body.source ?? 'MANUAL',
    });

    await this.emitAudit({
      action: 'CONTACT_CREATED',
      organizationId,
      actorUserId: principal.userId,
      entityId: row.id,
    });
    return this.mapContact(row);
  }

  async listContacts(
    principal: AuthPrincipal,
    query: ListContactsQuery,
  ): Promise<{
    readonly items: readonly ContactResponse[];
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  }> {
    const organizationId = this.orgId(principal);
    const where: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.hasEmail !== undefined
        ? query.hasEmail
          ? { email: { not: null } }
          : { email: null }
        : {}),
      ...(query.hasCustomFieldKey
        ? {
            customFieldValues: {
              some: {
                fieldKey: query.hasCustomFieldKey,
              },
            },
          }
        : {}),
      ...(query.listId
        ? {
            listMemberships: {
              some: {
                contactListId: query.listId,
                contactList: { deletedAt: null },
              },
            },
          }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
        { normalizedPhoneNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.ContactOrderByWithRelationInput;
    const [total, rows] = await Promise.all([
      this.repo.countContacts(where),
      this.repo.listContacts({ where, skip, take: query.limit, orderBy }),
    ]);

    return createPaginatedResponse({
      items: rows.map((r) => this.mapContact(r)),
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getContact(principal: AuthPrincipal, contactId: string): Promise<ContactResponse> {
    const row = await this.getOwnedContact(principal, contactId);
    return this.mapContact(row);
  }

  async getContactMergeFields(
    principal: AuthPrincipal,
    contactId: string,
  ): Promise<Record<string, string>> {
    const row = await this.getOwnedContact(principal, contactId);
    return this.mapContact(row).mergeFields;
  }

  async updateContact(
    principal: AuthPrincipal,
    contactId: string,
    body: UpdateContactBody,
  ): Promise<ContactResponse> {
    const existing = await this.getOwnedContact(principal, contactId);
    const organizationId = this.orgId(principal);

    const normalized =
      body.phoneNumber !== undefined ||
      body.firstName !== undefined ||
      body.lastName !== undefined ||
      body.fullName !== undefined ||
      body.email !== undefined ||
      body.notes !== undefined
        ? this.normalization.normalizeContact({
            firstName: body.firstName ?? existing.firstName,
            lastName: body.lastName ?? existing.lastName,
            fullName: body.fullName ?? existing.fullName,
            phoneNumber: body.phoneNumber ?? existing.phoneNumber,
            email: body.email ?? existing.email,
            notes: body.notes ?? existing.notes,
          })
        : null;

    if (normalized && normalized.normalizedPhoneNumber !== existing.normalizedPhoneNumber) {
      const conflict = await this.repo.findContactByNormalizedPhone({
        organizationId,
        normalizedPhoneNumber: normalized.normalizedPhoneNumber,
      });
      if (conflict && conflict.id !== existing.id) {
        throw new InvalidContactInputException('A contact with this phone number already exists');
      }
    }

    const row = await this.repo.updateContact(contactId, {
      ...(normalized
        ? {
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            fullName: normalized.fullName,
            phoneNumber: normalized.phoneNumber,
            normalizedPhoneNumber: normalized.normalizedPhoneNumber,
            email: normalized.email,
            notes: normalized.notes,
          }
        : {}),
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as Prisma.InputJsonValue }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    });

    await this.emitAudit({
      action: 'CONTACT_UPDATED',
      organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
      metadata: { updatedFields: Object.keys(body) },
    });

    return this.mapContact(row);
  }

  async deleteContact(principal: AuthPrincipal, contactId: string): Promise<void> {
    const row = await this.getOwnedContact(principal, contactId);
    await this.repo.updateContact(contactId, {
      deletedAt: new Date(),
      status: 'ARCHIVED',
    });
    await this.emitAudit({
      action: 'CONTACT_DELETED',
      organizationId: row.organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
    });
  }

  async upsertCustomFields(
    principal: AuthPrincipal,
    contactId: string,
    body: UpsertContactCustomFieldsBody,
  ): Promise<ContactResponse> {
    const row = await this.getOwnedContact(principal, contactId);
    const organizationId = row.organizationId;

    await this.prisma.$transaction(async (tx) => {
      for (const field of body.fields) {
        await tx.contactCustomFieldValue.upsert({
          where: {
            contactId_fieldKey: {
              contactId,
              fieldKey: field.fieldKey,
            },
          },
          update: {
            fieldValue: field.fieldValue,
            valueType: field.valueType,
          },
          create: {
            organizationId,
            contactId,
            fieldKey: field.fieldKey,
            fieldValue: field.fieldValue,
            valueType: field.valueType,
          },
        });
      }
    });

    const fresh = await this.getOwnedContact(principal, contactId);
    await this.emitAudit({
      action: 'CONTACT_UPDATED',
      organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
      metadata: { updatedCustomFields: body.fields.length },
    });
    return this.mapContact(fresh);
  }

  async optOut(principal: AuthPrincipal, contactId: string): Promise<ContactResponse> {
    const row = await this.getOwnedContact(principal, contactId);
    const updated = await this.repo.updateContact(contactId, {
      status: 'OPTED_OUT',
      optedOutAt: new Date(),
    });
    await this.emitAudit({
      action: 'CONTACT_OPTED_OUT',
      organizationId: row.organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
    });
    return this.mapContact(updated);
  }

  async block(principal: AuthPrincipal, contactId: string): Promise<ContactResponse> {
    const row = await this.getOwnedContact(principal, contactId);
    const updated = await this.repo.updateContact(contactId, {
      status: 'BLOCKED',
      blockedAt: new Date(),
    });
    await this.emitAudit({
      action: 'CONTACT_BLOCKED',
      organizationId: row.organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
    });
    return this.mapContact(updated);
  }

  async unblock(principal: AuthPrincipal, contactId: string): Promise<ContactResponse> {
    const row = await this.getOwnedContact(principal, contactId);
    const nextStatus = row.status === 'OPTED_OUT' ? 'OPTED_OUT' : 'ACTIVE';
    const updated = await this.repo.updateContact(contactId, {
      status: nextStatus,
      ...(nextStatus === 'ACTIVE' ? { blockedAt: null } : {}),
    });
    await this.emitAudit({
      action: 'CONTACT_UNBLOCKED',
      organizationId: row.organizationId,
      actorUserId: principal.userId,
      entityId: contactId,
      metadata: { nextStatus },
    });
    return this.mapContact(updated);
  }
}
