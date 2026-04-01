import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import { ContactsService } from '../contacts/contacts.service';
import { QuotaEnforcementService } from '../billing/quota-enforcement.service';
import type { CreateTemplateBody } from './dto/create-template.dto';
import type { ListTemplatesQuery } from './dto/list-templates.query.dto';
import type {
  RenderStoredTemplatePreviewBody,
  RenderTemplatePreviewBody,
} from './dto/render-template-preview.dto';
import type { UpdateTemplateBody } from './dto/update-template.dto';
import type { ValidateTemplateBody } from './dto/validate-template.dto';
import {
  TemplateAccessDeniedException,
  TemplateNotFoundException,
} from './exceptions/templates.exceptions';
import { TemplateRendererService } from './template-renderer.service';
import { TemplateVariableService } from './template-variable.service';
import { TemplatesRepository, type TemplateRow } from './templates.repository';
import type {
  RenderTemplateResponse,
  TemplateResponse,
  ValidateTemplateResponse,
} from './types/template.types';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly repo: TemplatesRepository,
    private readonly renderer: TemplateRendererService,
    private readonly variable: TemplateVariableService,
    private readonly contacts: ContactsService,
    private readonly audit: AuditLogService,
    private readonly quota: QuotaEnforcementService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  private mapTemplate(row: TemplateRow): TemplateResponse {
    return {
      id: row.id,
      organizationId: row.organizationId,
      createdByUserId: row.createdByUserId,
      name: row.name,
      description: row.description,
      body: row.body,
      channelType: row.channelType,
      isArchived: row.isArchived,
      metadata: row.metadata,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      variables: this.variable.extractVariables(row.body),
    };
  }

  private async emitAudit(args: {
    readonly action: AuditAction;
    readonly principal: AuthPrincipal;
    readonly entityId?: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const ctx = getRequestContext();
    await this.audit.emit({
      action: args.action,
      entityType: 'template',
      ...(args.entityId ? { entityId: args.entityId } : {}),
      ...(args.principal.organizationId ? { organizationId: args.principal.organizationId } : {}),
      actorUserId: args.principal.userId,
      ...(args.metadata ? { metadata: args.metadata } : {}),
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }

  private async getOwnedTemplate(
    principal: AuthPrincipal,
    templateId: string,
  ): Promise<TemplateRow> {
    const row = await this.repo.findById(templateId);
    if (!row) throw new TemplateNotFoundException();
    if (row.deletedAt !== null) throw new TemplateNotFoundException();
    if (row.organizationId !== this.orgId(principal)) throw new TemplateAccessDeniedException();
    return row;
  }

  async createTemplate(
    principal: AuthPrincipal,
    body: CreateTemplateBody,
  ): Promise<TemplateResponse> {
    const organizationId = this.orgId(principal);
    const templateCount = await this.repo.count({ organizationId, deletedAt: null });
    await this.quota.assertBelowLimit({
      organizationId,
      entitlementCode: 'templates.max',
      currentValue: templateCount,
    });
    const row = await this.repo.create({
      organizationId,
      createdByUserId: principal.userId,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      body: body.body,
      channelType: body.channelType,
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as Prisma.InputJsonValue }
        : {}),
    });
    await this.emitAudit({ action: 'TEMPLATE_CREATED', principal, entityId: row.id });
    return this.mapTemplate(row);
  }

  async listTemplates(principal: AuthPrincipal, query: ListTemplatesQuery) {
    const where: Prisma.TemplateWhereInput = {
      organizationId: this.orgId(principal),
      deletedAt: null,
      ...(query.channelType ? { channelType: query.channelType } : {}),
      ...(query.isArchived !== undefined ? { isArchived: query.isArchived } : {}),
    };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.repo.count(where),
      this.repo.list({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder } as Prisma.TemplateOrderByWithRelationInput,
      }),
    ]);

    return createPaginatedResponse({
      items: rows.map((r) => this.mapTemplate(r)),
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getTemplate(principal: AuthPrincipal, templateId: string): Promise<TemplateResponse> {
    return this.mapTemplate(await this.getOwnedTemplate(principal, templateId));
  }

  async updateTemplate(
    principal: AuthPrincipal,
    templateId: string,
    body: UpdateTemplateBody,
  ): Promise<TemplateResponse> {
    await this.getOwnedTemplate(principal, templateId);
    const row = await this.repo.update(templateId, {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.channelType !== undefined ? { channelType: body.channelType } : {}),
      ...(body.isArchived !== undefined ? { isArchived: body.isArchived } : {}),
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as Prisma.InputJsonValue }
        : {}),
    });
    await this.emitAudit({
      action: 'TEMPLATE_UPDATED',
      principal,
      entityId: row.id,
      metadata: { updatedFields: Object.keys(body) },
    });
    return this.mapTemplate(row);
  }

  async deleteTemplate(principal: AuthPrincipal, templateId: string): Promise<void> {
    await this.getOwnedTemplate(principal, templateId);
    await this.repo.update(templateId, { deletedAt: new Date(), isArchived: true });
    await this.emitAudit({ action: 'TEMPLATE_DELETED', principal, entityId: templateId });
  }

  async validateTemplate(
    principal: AuthPrincipal,
    body: ValidateTemplateBody,
  ): Promise<ValidateTemplateResponse> {
    const validation = this.variable.validatePlaceholders(body.body);
    let renderedPreview: string | null = null;
    let missingVariables: string[] = [];
    let meta = this.renderer.estimateSmsSegments(body.body);

    if (validation.isValid && body.mergeFields) {
      const rendered = this.renderer.render({
        body: body.body,
        mergeFields: body.mergeFields,
        missingVariableStrategy: body.missingVariableStrategy,
      });
      renderedPreview = rendered.renderedText;
      missingVariables = [...rendered.missingVariables];
      meta = rendered;
    }

    await this.emitAudit({
      action: 'TEMPLATE_VALIDATED',
      principal,
      metadata: { variables: validation.variables.length, isValid: validation.isValid },
    });

    return {
      isValid: validation.isValid,
      variables: validation.variables,
      invalidPlaceholders: validation.invalidPlaceholders,
      missingVariables,
      renderedPreview,
      ...meta,
    };
  }

  async renderPreview(
    principal: AuthPrincipal,
    body: RenderTemplatePreviewBody,
  ): Promise<RenderTemplateResponse> {
    const rendered = this.renderer.render({
      body: body.body,
      mergeFields: body.mergeFields,
      missingVariableStrategy: body.missingVariableStrategy,
    });
    await this.emitAudit({
      action: 'TEMPLATE_PREVIEW_RENDERED',
      principal,
      metadata: { mode: 'direct', variableCount: rendered.variables.length },
    });
    return rendered;
  }

  async renderStoredPreview(
    principal: AuthPrincipal,
    templateId: string,
    body: RenderStoredTemplatePreviewBody,
  ): Promise<RenderTemplateResponse> {
    const template = await this.getOwnedTemplate(principal, templateId);
    const mergeFields =
      body.contactId !== undefined
        ? await this.contacts.getContactMergeFields(principal, body.contactId)
        : (body.mergeFields ?? {});

    const rendered = this.renderer.render({
      body: template.body,
      mergeFields,
      missingVariableStrategy: body.missingVariableStrategy,
    });

    await this.emitAudit({
      action: 'TEMPLATE_PREVIEW_RENDERED',
      principal,
      entityId: templateId,
      metadata: {
        mode: body.contactId ? 'contact' : 'direct',
        variableCount: rendered.variables.length,
      },
    });
    return rendered;
  }
}
