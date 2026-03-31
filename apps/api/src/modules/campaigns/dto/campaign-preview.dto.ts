import { z } from 'zod';

const targetSchema = z.object({
  contactIds: z.array(z.string().min(1)).default([]),
  contactListIds: z.array(z.string().min(1)).default([]),
});

export const CampaignPreviewBodySchema = z
  .object({
    templateId: z.string().min(1).optional(),
    templateBody: z.string().min(1).max(100_000).optional(),
    target: targetSchema,
    missingVariableStrategy: z.enum(['strict', 'empty']).default('empty'),
    sampleLimit: z.coerce.number().int().positive().max(50).default(5),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.templateId === undefined && val.templateBody === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide templateId or templateBody',
        path: ['templateId'],
      });
    }
    if (val.target.contactIds.length === 0 && val.target.contactListIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'target must include at least one contactId or contactListId',
        path: ['target'],
      });
    }
  });

export type CampaignPreviewBody = z.infer<typeof CampaignPreviewBodySchema>;
