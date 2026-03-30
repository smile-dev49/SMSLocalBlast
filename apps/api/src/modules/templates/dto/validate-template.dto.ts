import { z } from 'zod';

export const ValidateTemplateBodySchema = z
  .object({
    body: z.string().min(1).max(5000),
    mergeFields: z.record(z.string()).optional(),
    missingVariableStrategy: z.enum(['strict', 'empty']).optional().default('strict'),
  })
  .strict();

export type ValidateTemplateBody = z.infer<typeof ValidateTemplateBodySchema>;
