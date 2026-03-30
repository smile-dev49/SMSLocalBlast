import { z } from 'zod';

export const CreateContactListBodySchema = z
  .object({
    name: z.string().min(1).max(160),
    description: z.string().max(500).optional(),
    color: z.string().max(40).optional(),
  })
  .strict();

export type CreateContactListBody = z.infer<typeof CreateContactListBodySchema>;
