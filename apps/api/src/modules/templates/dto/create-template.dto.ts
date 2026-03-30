import { z } from 'zod';

export const CreateTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
    body: z.string().min(1).max(5000),
    channelType: z.enum(['SMS', 'MMS']).optional().default('SMS'),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type CreateTemplateBody = z.infer<typeof CreateTemplateBodySchema>;
