import { Injectable } from '@nestjs/common';

const PLACEHOLDER_REGEX = /\{\{([^{}]+)\}\}/g;
const KEY_REGEX = /^[A-Za-z][A-Za-z0-9_]*$/;

@Injectable()
export class TemplateVariableService {
  extractVariables(body: string): readonly string[] {
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = PLACEHOLDER_REGEX.exec(body)) !== null) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      if (KEY_REGEX.test(raw)) seen.add(raw);
    }
    return [...seen];
  }

  validatePlaceholders(body: string): {
    readonly isValid: boolean;
    readonly variables: readonly string[];
    readonly invalidPlaceholders: readonly string[];
  } {
    const invalid: string[] = [];
    const variables = this.extractVariables(body);

    // Catch unmatched braces.
    const openCount = (body.match(/\{\{/g) ?? []).length;
    const closeCount = (body.match(/\}\}/g) ?? []).length;
    if (openCount !== closeCount) {
      invalid.push('Unbalanced placeholder braces');
    }

    // Catch malformed placeholder keys inside {{...}}.
    let match: RegExpExecArray | null;
    while ((match = PLACEHOLDER_REGEX.exec(body)) !== null) {
      const raw = match[1]?.trim() ?? '';
      if (!KEY_REGEX.test(raw)) {
        invalid.push(raw.length > 0 ? raw : '<empty>');
      }
    }

    return {
      isValid: invalid.length === 0,
      variables,
      invalidPlaceholders: invalid,
    };
  }

  normalizeKey(key: string): string {
    return key.trim().toLowerCase();
  }
}
