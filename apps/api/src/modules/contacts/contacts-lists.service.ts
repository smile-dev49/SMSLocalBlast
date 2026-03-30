import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import type { CreateContactListBody } from './dto/create-contact-list.dto';
import type { ListContactListsQuery } from './dto/list-contact-lists.query.dto';
import type { UpdateContactListBody } from './dto/update-contact-list.dto';
import type { AddContactsToListBody } from './dto/contact-list-members.dto';
import {
  ContactAccessDeniedException,
  ContactListAccessDeniedException,
  ContactListNotFoundException,
} from './exceptions/contacts.exceptions';
import type { ContactListResponse } from './types/contact.types';
import { ContactsRepository, type ContactListRow } from './contacts.repository';

@Injectable()
export class ContactsListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: ContactsRepository,
    private readonly audit: AuditLogService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  private mapList(row: ContactListRow, memberCount?: number): ContactListResponse {
    return {
      id: row.id,
      organizationId: row.organizationId,
      createdByUserId: row.createdByUserId,
      name: row.name,
      description: row.description,
      color: row.color,
      isArchived: row.isArchived,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...(memberCount !== undefined ? { memberCount } : {}),
    };
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
      entityType: 'contact_list',
      entityId: args.entityId,
      organizationId: args.organizationId,
      actorUserId: args.actorUserId,
      ...(args.metadata ? { metadata: args.metadata } : {}),
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }

  async createList(
    principal: AuthPrincipal,
    body: CreateContactListBody,
  ): Promise<ContactListResponse> {
    const organizationId = this.orgId(principal);
    const row = await this.repo.createContactList({
      organizationId,
      createdByUserId: principal.userId,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      color: body.color?.trim() ?? null,
    });
    await this.emitAudit({
      action: 'CONTACT_LIST_CREATED',
      organizationId,
      actorUserId: principal.userId,
      entityId: row.id,
    });
    return this.mapList(row, 0);
  }

  async listLists(
    principal: AuthPrincipal,
    query: ListContactListsQuery,
  ): Promise<{
    readonly items: readonly ContactListResponse[];
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  }> {
    const organizationId = this.orgId(principal);
    const where: Prisma.ContactListWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.isArchived !== undefined ? { isArchived: query.isArchived } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    } as Prisma.ContactListOrderByWithRelationInput;

    const [total, rows] = await Promise.all([
      this.prisma.contactList.count({ where }),
      this.prisma.contactList.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: { _count: { select: { memberships: true } } },
      }),
    ]);

    return createPaginatedResponse({
      items: rows.map((row) =>
        this.mapList(
          {
            id: row.id,
            organizationId: row.organizationId,
            createdByUserId: row.createdByUserId,
            name: row.name,
            description: row.description,
            color: row.color,
            isArchived: row.isArchived,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt,
          },
          row._count.memberships,
        ),
      ),
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getList(principal: AuthPrincipal, listId: string): Promise<ContactListResponse> {
    const organizationId = this.orgId(principal);
    const list = await this.repo.findContactListById(listId);
    if (!list) throw new ContactListNotFoundException();
    if (list.deletedAt !== null) throw new ContactListNotFoundException();
    if (list.organizationId !== organizationId) throw new ContactListAccessDeniedException();
    const memberCount = await this.prisma.contactListMembership.count({
      where: { contactListId: list.id, organizationId, contact: { deletedAt: null } },
    });
    return this.mapList(list, memberCount);
  }

  async updateList(
    principal: AuthPrincipal,
    listId: string,
    body: UpdateContactListBody,
  ): Promise<ContactListResponse> {
    const organizationId = this.orgId(principal);
    const list = await this.repo.findContactListById(listId);
    if (!list) throw new ContactListNotFoundException();
    if (list.deletedAt !== null) throw new ContactListNotFoundException();
    if (list.organizationId !== organizationId) throw new ContactListAccessDeniedException();

    const updated = await this.repo.updateContactList(listId, {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim().length > 0 ? body.description.trim() : null }
        : {}),
      ...(body.color !== undefined
        ? { color: body.color.trim().length > 0 ? body.color.trim() : null }
        : {}),
      ...(body.isArchived !== undefined ? { isArchived: body.isArchived } : {}),
    });

    await this.emitAudit({
      action: 'CONTACT_LIST_UPDATED',
      organizationId,
      actorUserId: principal.userId,
      entityId: listId,
      metadata: { updatedFields: Object.keys(body) },
    });

    return this.mapList(updated);
  }

  async deleteList(principal: AuthPrincipal, listId: string): Promise<void> {
    const organizationId = this.orgId(principal);
    const list = await this.repo.findContactListById(listId);
    if (!list) throw new ContactListNotFoundException();
    if (list.deletedAt !== null) throw new ContactListNotFoundException();
    if (list.organizationId !== organizationId) throw new ContactListAccessDeniedException();

    await this.repo.updateContactList(listId, { deletedAt: new Date(), isArchived: true });
    await this.emitAudit({
      action: 'CONTACT_LIST_DELETED',
      organizationId,
      actorUserId: principal.userId,
      entityId: listId,
    });
  }

  async addContacts(
    principal: AuthPrincipal,
    listId: string,
    body: AddContactsToListBody,
  ): Promise<{ added: number }> {
    const organizationId = this.orgId(principal);
    const list = await this.repo.findContactListById(listId);
    if (!list) throw new ContactListNotFoundException();
    if (list.deletedAt !== null) throw new ContactListNotFoundException();
    if (list.organizationId !== organizationId) throw new ContactListAccessDeniedException();
    if (list.isArchived) {
      throw new ContactListAccessDeniedException();
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        id: { in: body.contactIds },
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (contacts.length !== body.contactIds.length) {
      throw new ContactAccessDeniedException();
    }

    const inserted = await this.prisma.contactListMembership.createMany({
      data: contacts.map((c) => ({
        organizationId,
        contactId: c.id,
        contactListId: listId,
      })),
      skipDuplicates: true,
    });

    await this.emitAudit({
      action: 'CONTACT_LIST_MEMBERS_ADDED',
      organizationId,
      actorUserId: principal.userId,
      entityId: listId,
      metadata: { count: inserted.count },
    });

    return { added: inserted.count };
  }

  async removeContact(principal: AuthPrincipal, listId: string, contactId: string): Promise<void> {
    const organizationId = this.orgId(principal);
    const list = await this.repo.findContactListById(listId);
    if (!list) throw new ContactListNotFoundException();
    if (list.deletedAt !== null) throw new ContactListNotFoundException();
    if (list.organizationId !== organizationId) throw new ContactListAccessDeniedException();

    await this.prisma.contactListMembership.deleteMany({
      where: {
        contactListId: listId,
        contactId,
        organizationId,
      },
    });

    await this.emitAudit({
      action: 'CONTACT_LIST_MEMBER_REMOVED',
      organizationId,
      actorUserId: principal.userId,
      entityId: listId,
      metadata: { contactId },
    });
  }
}
