import { z } from 'zod';

export const ListContactsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().min(1).max(200).optional(),
    status: z.enum(['ACTIVE', 'BLOCKED', 'OPTED_OUT', 'ARCHIVED']).optional(),
    listId: z.string().min(1).max(64).optional(),
    hasEmail: z.coerce.boolean().optional(),
    hasCustomFieldKey: z.string().min(1).max(80).optional(),
    sortBy: z
      .enum(['createdAt', 'firstName', 'lastName', 'fullName', 'phoneNumber', 'status'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict();

export type ListContactsQuery = z.infer<typeof ListContactsQuerySchema>;
