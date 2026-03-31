import { z } from 'zod';

export const RetryMessageBodySchema = z
  .object({
    reason: z.string().min(1).max(256).optional(),
  })
  .strict();

export type RetryMessageBody = z.infer<typeof RetryMessageBodySchema>;
