import { z } from 'zod';

export const RenderTemplatePreviewBodySchema = z
  .object({
    body: z.string().min(1).max(5000),
    mergeFields: z.record(z.string()).default({}),
    missingVariableStrategy: z.enum(['strict', 'empty']).optional().default('strict'),
  })
  .strict();

export type RenderTemplatePreviewBody = z.infer<typeof RenderTemplatePreviewBodySchema>;

export const RenderStoredTemplatePreviewBodySchema = z
  .object({
    contactId: z.string().min(1).max(64).optional(),
    mergeFields: z.record(z.string()).optional(),
    missingVariableStrategy: z.enum(['strict', 'empty']).optional().default('strict'),
  })
  .strict()
  .refine((v) => v.contactId !== undefined || v.mergeFields !== undefined, {
    message: 'Either contactId or mergeFields is required',
  });

export type RenderStoredTemplatePreviewBody = z.infer<typeof RenderStoredTemplatePreviewBodySchema>;
