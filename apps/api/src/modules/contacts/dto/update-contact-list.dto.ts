import { z } from 'zod';

export const UpdateContactListBodySchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    description: z.string().max(500).optional(),
    color: z.string().max(40).optional(),
    isArchived: z.coerce.boolean().optional(),
  })
  .strict();

export type UpdateContactListBody = z.infer<typeof UpdateContactListBodySchema>;
