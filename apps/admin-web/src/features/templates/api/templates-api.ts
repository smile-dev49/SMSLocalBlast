import { httpRequest } from '@/core/network/http-client';

export interface TemplateRow {
  readonly id: string;
  readonly name: string;
  readonly body: string;
  readonly channelType: string;
  readonly isArchived: boolean;
  readonly createdAt: string;
}

export interface TemplateListResponse {
  readonly items: readonly TemplateRow[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export const templatesApi = {
  list: (
    params: { readonly page?: number; readonly limit?: number; readonly search?: string } = {},
  ) => {
    const p = new URLSearchParams();
    if (params.page !== undefined) p.set('page', String(params.page));
    if (params.limit !== undefined) p.set('limit', String(params.limit));
    if (params.search) p.set('search', params.search);
    const qs = p.toString();
    return httpRequest<TemplateListResponse>(`/templates${qs ? `?${qs}` : ''}`);
  },

  get: (templateId: string) => httpRequest<TemplateRow>(`/templates/${templateId}`),
};
