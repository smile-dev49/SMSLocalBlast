import { Injectable } from '@nestjs/common';
import type { AuditAction, ContactSource } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import type { ImportContactsBody } from './dto/import-contacts.dto';
import type {
  ContactCustomFieldEntry,
  ImportConfirmResponse,
  ImportPreviewResponse,
} from './types/contact.types';
import { ContactsNormalizationService } from './contacts-normalization.service';

interface PreparedRow {
  readonly rowIndex: number;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly phoneNumber: string;
  readonly normalizedPhoneNumber: string;
  readonly email: string | null;
  readonly customFields: readonly ContactCustomFieldEntry[];
}

@Injectable()
export class ContactsImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: ContactsNormalizationService,
    private readonly audit: AuditLogService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  private extractString(row: Record<string, unknown>, column?: string): string | null {
    if (!column) return null;
    const value = row[column];
    if (value === undefined || value === null) return null;
    let str: string;
    if (typeof value === 'string') {
      str = value;
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      str = value.toString();
    } else {
      return null;
    }
    str = str.trim();
    return str.length > 0 ? str : null;
  }

  private mapRow(
    raw: Record<string, unknown>,
    body: ImportContactsBody,
    rowIndex: number,
  ): PreparedRow {
    const firstName = this.extractString(raw, body.mapping.firstName);
    const lastName = this.extractString(raw, body.mapping.lastName);
    const fullName = this.extractString(raw, body.mapping.fullName);
    const phoneRaw = this.extractString(raw, body.mapping.phoneNumber);
    if (!phoneRaw) {
      throw new Error('Missing phone number');
    }
    const email = this.extractString(raw, body.mapping.email);

    const normalized = this.normalization.normalizeContact({
      firstName,
      lastName,
      fullName,
      phoneNumber: phoneRaw,
      email,
    });

    const customFields: ContactCustomFieldEntry[] = [];
    const customMapping = body.mapping.customFields ?? {};
    for (const [fieldKey, sourceColumn] of Object.entries(customMapping)) {
      const value = this.extractString(raw, sourceColumn);
      if (value === null) continue;
      customFields.push({
        fieldKey,
        fieldValue: value,
        valueType: 'TEXT',
      });
    }

    return {
      rowIndex,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      fullName: normalized.fullName,
      phoneNumber: normalized.phoneNumber,
      normalizedPhoneNumber: normalized.normalizedPhoneNumber,
      email: normalized.email,
      customFields,
    };
  }

  async previewImport(
    principal: AuthPrincipal,
    body: ImportContactsBody,
  ): Promise<ImportPreviewResponse> {
    const organizationId = this.orgId(principal);
    const rowErrors: { rowIndex: number; message: string }[] = [];
    const prepared: PreparedRow[] = [];

    body.rows.forEach((row, idx) => {
      try {
        prepared.push(this.mapRow(row, body, idx));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid row';
        rowErrors.push({ rowIndex: idx, message });
      }
    });

    const seen = new Set<string>();
    const duplicateIndexes = new Set<number>();
    for (const row of prepared) {
      if (seen.has(row.normalizedPhoneNumber)) {
        duplicateIndexes.add(row.rowIndex);
      } else {
        seen.add(row.normalizedPhoneNumber);
      }
    }

    const existingContacts = await this.prisma.contact.findMany({
      where: {
        organizationId,
        deletedAt: null,
        normalizedPhoneNumber: { in: [...seen] },
      },
      select: { id: true, normalizedPhoneNumber: true },
    });
    const existingByPhone = new Map(existingContacts.map((c) => [c.normalizedPhoneNumber, c.id]));

    const normalizedSampleRows = prepared.slice(0, 200).map((row) => ({
      rowIndex: row.rowIndex,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      normalizedPhoneNumber: row.normalizedPhoneNumber,
      email: row.email,
      customFields: row.customFields,
      duplicateInPayload: duplicateIndexes.has(row.rowIndex),
      existingContactId: existingByPhone.get(row.normalizedPhoneNumber) ?? null,
    }));

    const preview: ImportPreviewResponse = {
      totalRows: body.rows.length,
      validRows: prepared.length,
      invalidRows: rowErrors.length,
      duplicateRows: duplicateIndexes.size,
      existingMatches: existingContacts.length,
      rowErrors,
      normalizedSampleRows,
    };

    await this.emitAudit({
      action: 'CONTACTS_IMPORT_PREVIEWED',
      organizationId,
      actorUserId: principal.userId,
      metadata: {
        totalRows: preview.totalRows,
        validRows: preview.validRows,
        invalidRows: preview.invalidRows,
      },
    });

    return preview;
  }

  async confirmImport(
    principal: AuthPrincipal,
    body: ImportContactsBody,
  ): Promise<ImportConfirmResponse> {
    const organizationId = this.orgId(principal);
    const preview = await this.previewImport(principal, body);

    const toProcess = preview.normalizedSampleRows;
    const existing = await this.prisma.contact.findMany({
      where: {
        organizationId,
        deletedAt: null,
        normalizedPhoneNumber: { in: toProcess.map((r) => r.normalizedPhoneNumber) },
      },
      select: { id: true, normalizedPhoneNumber: true },
    });
    const existingByPhone = new Map(existing.map((c) => [c.normalizedPhoneNumber, c.id]));

    let createdContacts = 0;
    let updatedContacts = 0;
    let skippedRows = 0;
    const importedContactIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const row of toProcess) {
        if (row.duplicateInPayload && body.options.deduplicateByPhone) {
          skippedRows += 1;
          continue;
        }
        const existingId = existingByPhone.get(row.normalizedPhoneNumber);

        if (existingId) {
          if (!body.options.updateExisting) {
            skippedRows += 1;
            continue;
          }
          const updated = await tx.contact.update({
            where: { id: existingId },
            data: {
              firstName: row.firstName,
              lastName: row.lastName,
              fullName: row.fullName,
              phoneNumber: row.phoneNumber,
              email: row.email,
              source: body.sourceType as ContactSource,
            },
            select: { id: true },
          });
          importedContactIds.push(updated.id);
          updatedContacts += 1;
        } else {
          const created = await tx.contact.create({
            data: {
              organizationId,
              createdByUserId: principal.userId,
              firstName: row.firstName,
              lastName: row.lastName,
              fullName: row.fullName,
              phoneNumber: row.phoneNumber,
              normalizedPhoneNumber: row.normalizedPhoneNumber,
              email: row.email,
              source: body.sourceType as ContactSource,
            },
            select: { id: true },
          });
          importedContactIds.push(created.id);
          createdContacts += 1;
        }

        const targetId = importedContactIds[importedContactIds.length - 1];
        if (!targetId) continue;
        if (row.customFields.length > 0) {
          await tx.contactCustomFieldValue.createMany({
            data: row.customFields.map((f) => ({
              organizationId,
              contactId: targetId,
              fieldKey: f.fieldKey,
              fieldValue: f.fieldValue,
              valueType: f.valueType,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (body.options.createListName && importedContactIds.length > 0) {
        const list = await tx.contactList.create({
          data: {
            organizationId,
            createdByUserId: principal.userId,
            name: body.options.createListName.trim(),
          },
          select: { id: true },
        });
        await tx.contactListMembership.createMany({
          data: importedContactIds.map((contactId) => ({
            organizationId,
            contactId,
            contactListId: list.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    const summary: ImportConfirmResponse = {
      totalRows: body.rows.length,
      createdContacts,
      updatedContacts,
      skippedRows,
      invalidRows: preview.invalidRows,
      targetListId: null,
    };

    await this.emitAudit({
      action: 'CONTACTS_IMPORT_CONFIRMED',
      organizationId,
      actorUserId: principal.userId,
      metadata: {
        createdContacts,
        updatedContacts,
        skippedRows,
        invalidRows: preview.invalidRows,
      },
    });

    return summary;
  }

  private async emitAudit(args: {
    readonly action: AuditAction;
    readonly organizationId: string;
    readonly actorUserId: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const ctx = getRequestContext();
    await this.audit.emit({
      action: args.action,
      entityType: 'contacts_import',
      organizationId: args.organizationId,
      actorUserId: args.actorUserId,
      ...(args.metadata ? { metadata: args.metadata } : {}),
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }
}
