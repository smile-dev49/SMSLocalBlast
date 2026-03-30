import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates `body`, `query`, or `params` using a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(createOrgSchema))` or method-level `@UsePipes(new ZodValidationPipe(schema))`.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const allowed = new Set<ArgumentMetadata['type']>(['body', 'query', 'param', 'custom']);
    if (!allowed.has(metadata.type)) {
      return value as T;
    }

    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
