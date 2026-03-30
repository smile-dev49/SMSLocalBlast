import { z } from 'zod';

const DevicePlatformSchema = z.enum(['ANDROID', 'IOS']);
const DeviceStatusSchema = z.enum(['PENDING', 'ONLINE', 'OFFLINE', 'SUSPENDED', 'DISCONNECTED']);

const SortOrderSchema = z.enum(['asc', 'desc']);

export const ListDevicesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),

    search: z.string().min(1).max(200).optional(),
    platform: DevicePlatformSchema.optional(),
    status: DeviceStatusSchema.optional(),
    isActive: z.coerce.boolean().optional(),

    sortBy: z
      .enum([
        'createdAt',
        'name',
        'platform',
        'status',
        'healthStatus',
        'lastSeenAt',
        'lastHeartbeatAt',
        'dailySentCount',
      ])
      .optional()
      .default('createdAt'),
    sortOrder: SortOrderSchema.optional().default('desc'),
  })
  .strict();

export type ListDevicesQuery = z.infer<typeof ListDevicesQuerySchema>;
