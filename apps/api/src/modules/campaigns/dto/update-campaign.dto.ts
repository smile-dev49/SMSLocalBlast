import { z } from 'zod';

const targetSchema = z.object({
  contactIds: z.array(z.string().min(1)).default([]),
  contactListIds: z.array(z.string().min(1)).default([]),
});

export const UpdateCampaignBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    templateId: z.string().min(1).nullable().optional(),
    target: targetSchema.optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
    timezone: z.string().max(64).nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    snapshotMissingVariableStrategy: z.enum(['strict', 'empty']).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.target) {
      if (val.target.contactIds.length === 0 && val.target.contactListIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'target must include at least one contactId or contactListId',
          path: ['target'],
        });
      }
    }
  });

export type UpdateCampaignBody = z.infer<typeof UpdateCampaignBodySchema>;
