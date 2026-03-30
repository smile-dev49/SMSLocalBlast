import { Injectable } from '@nestjs/common';
import { TemplateValidationException } from './exceptions/templates.exceptions';
import { TemplateVariableService } from './template-variable.service';
import type { RenderTemplateResponse, SmsSegmentsMeta } from './types/template.types';

@Injectable()
export class TemplateRendererService {
  constructor(private readonly vars: TemplateVariableService) {}

  estimateSmsSegments(text: string): SmsSegmentsMeta {
    const length = text.length;
    const estimatedSegments = length <= 160 ? 1 : Math.ceil(length / 153);
    return {
      length,
      estimatedSegments,
      isLongMessage: estimatedSegments > 1,
    };
  }

  render(args: {
    readonly body: string;
    readonly mergeFields: Record<string, string>;
    readonly missingVariableStrategy: 'strict' | 'empty';
  }): RenderTemplateResponse {
    const validation = this.vars.validatePlaceholders(args.body);
    if (!validation.isValid) {
      throw new TemplateValidationException('Template has invalid placeholders', {
        invalidPlaceholders: validation.invalidPlaceholders,
      });
    }

    const normalizedMap = new Map<string, string>();
    for (const [k, v] of Object.entries(args.mergeFields)) {
      normalizedMap.set(this.vars.normalizeKey(k), v);
    }

    const missing: string[] = [];
    const renderedText = args.body.replace(/\{\{([^{}]+)\}\}/g, (_full, raw: string) => {
      const key = raw.trim();
      const value = normalizedMap.get(this.vars.normalizeKey(key));
      if (value === undefined) {
        missing.push(key);
        return args.missingVariableStrategy === 'empty' ? '' : `{{${key}}}`;
      }
      return value;
    });

    if (args.missingVariableStrategy === 'strict' && missing.length > 0) {
      throw new TemplateValidationException('Missing merge fields for strict rendering', {
        missingVariables: [...new Set(missing)],
      });
    }

    const meta = this.estimateSmsSegments(renderedText);
    return {
      renderedText,
      variables: validation.variables,
      missingVariables: [...new Set(missing)],
      ...meta,
    };
  }
}
