import { z } from 'zod';

const SortOrderSchema = z.enum(['asc', 'desc']);

export const ListMessagesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().min(1).max(64).optional(),
    campaignId: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
    contactId: z.string().min(1).optional(),
    status: z
      .enum([
        'PENDING',
        'READY',
        'QUEUED',
        'DISPATCHING',
        'DISPATCHED',
        'SENT',
        'DELIVERED',
        'FAILED',
        'SKIPPED',
        'CANCELLED',
      ])
      .optional(),
    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'status',
        'scheduledAt',
        'nextRetryAt',
        'queuedAt',
        'lastStatusAt',
      ])
      .default('createdAt'),
    sortOrder: SortOrderSchema.default('desc'),
  })
  .strict();

export type ListMessagesQuery = z.infer<typeof ListMessagesQuerySchema>;
