import { z } from 'zod';

export const ListTemplatesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().min(1).max(200).optional(),
    channelType: z.enum(['SMS', 'MMS']).optional(),
    isArchived: z.coerce.boolean().optional(),
    sortBy: z
      .enum(['createdAt', 'name', 'updatedAt', 'lastUsedAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict();

export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;
