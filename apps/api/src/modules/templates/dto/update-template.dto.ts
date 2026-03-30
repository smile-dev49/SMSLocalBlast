import { z } from 'zod';

export const UpdateTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    description: z.string().max(1000).optional(),
    body: z.string().min(1).max(5000).optional(),
    channelType: z.enum(['SMS', 'MMS']).optional(),
    isArchived: z.coerce.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type UpdateTemplateBody = z.infer<typeof UpdateTemplateBodySchema>;
