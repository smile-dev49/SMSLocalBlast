import { z } from 'zod';

export const AddContactsToListBodySchema = z
  .object({
    contactIds: z.array(z.string().min(1).max(64)).min(1).max(1000),
  })
  .strict();

export type AddContactsToListBody = z.infer<typeof AddContactsToListBodySchema>;
