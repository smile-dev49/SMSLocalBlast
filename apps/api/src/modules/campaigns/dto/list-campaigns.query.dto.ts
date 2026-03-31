import { z } from 'zod';

const SortOrderSchema = z.enum(['asc', 'desc']);

export const ListCampaignsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().min(1).max(200).optional(),
    status: z
      .enum(['DRAFT', 'SCHEDULED', 'PROCESSING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED'])
      .optional(),
    templateId: z.string().min(1).optional(),
    scheduledFrom: z.string().datetime().optional(),
    scheduledTo: z.string().datetime().optional(),
    sortBy: z
      .enum(['name', 'createdAt', 'updatedAt', 'scheduledAt', 'status'])
      .default('createdAt'),
    sortOrder: SortOrderSchema.default('desc'),
  })
  .strict();

export type ListCampaignsQuery = z.infer<typeof ListCampaignsQuerySchema>;
