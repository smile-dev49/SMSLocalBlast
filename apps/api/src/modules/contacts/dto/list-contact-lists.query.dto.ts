import { z } from 'zod';

export const ListContactListsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().min(1).max(200).optional(),
    isArchived: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'name']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict();

export type ListContactListsQuery = z.infer<typeof ListContactListsQuerySchema>;
