import { z } from 'zod';

export const CancelMessageBodySchema = z
  .object({
    reason: z.string().min(1).max(256).optional(),
  })
  .strict();

export type CancelMessageBody = z.infer<typeof CancelMessageBodySchema>;
