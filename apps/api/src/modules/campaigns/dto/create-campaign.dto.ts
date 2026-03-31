import { z } from 'zod';

const targetSchema = z.object({
  contactIds: z.array(z.string().min(1)).default([]),
  contactListIds: z.array(z.string().min(1)).default([]),
});

export const CreateCampaignBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    templateId: z.string().min(1).optional(),
    target: targetSchema,
    scheduledAt: z.string().datetime().optional(),
    timezone: z.string().max(64).optional(),
    metadata: z.record(z.unknown()).optional(),
    snapshotMissingVariableStrategy: z.enum(['strict', 'empty']).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.target.contactIds.length === 0 && val.target.contactListIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'target must include at least one contactId or contactListId',
        path: ['target'],
      });
    }
  });

export type CreateCampaignBody = z.infer<typeof CreateCampaignBodySchema>;
