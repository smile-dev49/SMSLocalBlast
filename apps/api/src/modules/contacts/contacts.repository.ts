import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const contactSelect = {
  id: true,
  organizationId: true,
  createdByUserId: true,
  firstName: true,
  lastName: true,
  fullName: true,
  phoneNumber: true,
  normalizedPhoneNumber: true,
  email: true,
  status: true,
  source: true,
  notes: true,
  metadata: true,
  lastContactedAt: true,
  optedOutAt: true,
  blockedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  customFieldValues: {
    select: {
      fieldKey: true,
      fieldValue: true,
      valueType: true,
    },
  },
} satisfies Prisma.ContactSelect;

export type ContactRow = Prisma.ContactGetPayload<{ select: typeof contactSelect }>;

export const contactListSelect = {
  id: true,
  organizationId: true,
  createdByUserId: true,
  name: true,
  description: true,
  color: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.ContactListSelect;

export type ContactListRow = Prisma.ContactListGetPayload<{ select: typeof contactListSelect }>;

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createContact(data: Prisma.ContactUncheckedCreateInput): Promise<ContactRow> {
    return this.prisma.contact.create({ data, select: contactSelect });
  }

  findContactById(contactId: string): Promise<ContactRow | null> {
    return this.prisma.contact.findUnique({ where: { id: contactId }, select: contactSelect });
  }

  findContactByNormalizedPhone(args: {
    readonly organizationId: string;
    readonly normalizedPhoneNumber: string;
  }): Promise<ContactRow | null> {
    return this.prisma.contact.findFirst({
      where: {
        organizationId: args.organizationId,
        normalizedPhoneNumber: args.normalizedPhoneNumber,
        deletedAt: null,
      },
      select: contactSelect,
    });
  }

  updateContact(contactId: string, data: Prisma.ContactUpdateInput): Promise<ContactRow> {
    return this.prisma.contact.update({
      where: { id: contactId },
      data,
      select: contactSelect,
    });
  }

  listContacts(args: {
    readonly where: Prisma.ContactWhereInput;
    readonly skip: number;
    readonly take: number;
    readonly orderBy: Prisma.ContactOrderByWithRelationInput;
  }): Promise<readonly ContactRow[]> {
    return this.prisma.contact.findMany({
      where: args.where,
      skip: args.skip,
      take: args.take,
      orderBy: args.orderBy,
      select: contactSelect,
    });
  }

  countContacts(where: Prisma.ContactWhereInput): Promise<number> {
    return this.prisma.contact.count({ where });
  }

  createContactList(data: Prisma.ContactListUncheckedCreateInput): Promise<ContactListRow> {
    return this.prisma.contactList.create({ data, select: contactListSelect });
  }

  findContactListById(listId: string): Promise<ContactListRow | null> {
    return this.prisma.contactList.findUnique({
      where: { id: listId },
      select: contactListSelect,
    });
  }

  updateContactList(listId: string, data: Prisma.ContactListUpdateInput): Promise<ContactListRow> {
    return this.prisma.contactList.update({
      where: { id: listId },
      data,
      select: contactListSelect,
    });
  }

  findContactsByIdsForOrg(args: {
    readonly organizationId: string;
    readonly ids: readonly string[];
  }): Promise<ContactRow[]> {
    if (args.ids.length === 0) return Promise.resolve([]);
    return this.prisma.contact.findMany({
      where: {
        organizationId: args.organizationId,
        id: { in: [...args.ids] },
        deletedAt: null,
      },
      select: contactSelect,
    });
  }

  listMembershipPairsForLists(args: {
    readonly organizationId: string;
    readonly listIds: readonly string[];
  }): Promise<readonly { contactListId: string; contactId: string }[]> {
    if (args.listIds.length === 0) return Promise.resolve([]);
    return this.prisma.contactListMembership.findMany({
      where: {
        organizationId: args.organizationId,
        contactListId: { in: [...args.listIds] },
      },
      select: { contactListId: true, contactId: true },
    });
  }

  findContactListsByIdsForOrg(args: {
    readonly organizationId: string;
    readonly ids: readonly string[];
  }): Promise<ContactListRow[]> {
    if (args.ids.length === 0) return Promise.resolve([]);
    return this.prisma.contactList.findMany({
      where: {
        organizationId: args.organizationId,
        id: { in: [...args.ids] },
        deletedAt: null,
      },
      select: contactListSelect,
    });
  }
}
