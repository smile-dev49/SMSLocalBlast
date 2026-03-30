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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { TemplatesService } from './templates.service';
import { CreateTemplateBodySchema, type CreateTemplateBody } from './dto/create-template.dto';
import { ListTemplatesQuerySchema, type ListTemplatesQuery } from './dto/list-templates.query.dto';
import {
  RenderStoredTemplatePreviewBodySchema,
  RenderTemplatePreviewBodySchema,
  type RenderStoredTemplatePreviewBody,
  type RenderTemplatePreviewBody,
} from './dto/render-template-preview.dto';
import { TemplateIdParamSchema } from './dto/template-id.schema';
import { UpdateTemplateBodySchema, type UpdateTemplateBody } from './dto/update-template.dto';
import { ValidateTemplateBodySchema, type ValidateTemplateBody } from './dto/validate-template.dto';
import type {
  RenderTemplateResponse,
  TemplateResponse,
  ValidateTemplateResponse,
} from './types/template.types';

@ApiTags('Templates')
@ApiBearerAuth('access-token')
@Controller({ path: 'templates', version: '1' })
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Permissions('templates.write')
  @Post()
  @ApiOperation({ summary: 'Create template' })
  async createTemplate(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateTemplateBodySchema)) body: CreateTemplateBody,
  ): Promise<TemplateResponse> {
    return this.templatesService.createTemplate(user, body);
  }

  @Permissions('templates.read')
  @Get()
  @ApiOperation({ summary: 'List templates' })
  async listTemplates(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListTemplatesQuerySchema)) query: ListTemplatesQuery,
  ) {
    return this.templatesService.listTemplates(user, query);
  }

  @Permissions('templates.read')
  @Get(':templateId')
  async getTemplate(
    @CurrentUser() user: AuthPrincipal,
    @Param('templateId', new ZodValidationPipe(TemplateIdParamSchema)) templateId: string,
  ): Promise<TemplateResponse> {
    return this.templatesService.getTemplate(user, templateId);
  }

  @Permissions('templates.write')
  @Patch(':templateId')
  async updateTemplate(
    @CurrentUser() user: AuthPrincipal,
    @Param('templateId', new ZodValidationPipe(TemplateIdParamSchema)) templateId: string,
    @Body(new ZodValidationPipe(UpdateTemplateBodySchema)) body: UpdateTemplateBody,
  ): Promise<TemplateResponse> {
    return this.templatesService.updateTemplate(user, templateId, body);
  }

  @Permissions('templates.manage')
  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @CurrentUser() user: AuthPrincipal,
    @Param('templateId', new ZodValidationPipe(TemplateIdParamSchema)) templateId: string,
  ): Promise<void> {
    await this.templatesService.deleteTemplate(user, templateId);
  }

  @Permissions('templates.render')
  @Post('validate')
  async validateTemplate(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(ValidateTemplateBodySchema)) body: ValidateTemplateBody,
  ): Promise<ValidateTemplateResponse> {
    return this.templatesService.validateTemplate(user, body);
  }

  @Permissions('templates.render')
  @Post('render-preview')
  async renderPreview(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(RenderTemplatePreviewBodySchema)) body: RenderTemplatePreviewBody,
  ): Promise<RenderTemplateResponse> {
    return this.templatesService.renderPreview(user, body);
  }

  @Permissions('templates.render')
  @Post(':templateId/render-preview')
  async renderStoredPreview(
    @CurrentUser() user: AuthPrincipal,
    @Param('templateId', new ZodValidationPipe(TemplateIdParamSchema)) templateId: string,
    @Body(new ZodValidationPipe(RenderStoredTemplatePreviewBodySchema))
    body: RenderStoredTemplatePreviewBody,
  ): Promise<RenderTemplateResponse> {
    return this.templatesService.renderStoredPreview(user, templateId, body);
  }
}
