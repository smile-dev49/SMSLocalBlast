import { httpRequest } from '@/core/network/http-client';

export interface Template {
  id: string;
  name: string;
  body: string;
  channelType: 'SMS' | 'MMS';
}

export interface TemplatePreviewResponse {
  renderedText: string;
  variablesUsed: string[];
  missingVariables: string[];
  messageLength: number;
  estimatedSegments: number;
}

export const templatesApi = {
  list: () => httpRequest<{ items: Template[] }>('/templates?page=1&limit=50'),
  renderPreview: (body: {
    body: string;
    mergeFields: Record<string, string>;
    missingVariableStrategy: 'strict' | 'empty';
  }) => httpRequest<TemplatePreviewResponse>('/templates/render-preview', { method: 'POST', body }),
};
