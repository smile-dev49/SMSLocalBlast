import { z } from 'zod';

const DeviceStatusSchema = z.enum(['SUSPENDED', 'DISCONNECTED']);

export const UpdateDeviceQuotaBodySchema = z
  .object({
    dailySendLimit: z.coerce.number().int().min(0).optional(),
    hourlySendLimit: z.coerce.number().int().min(0).optional(),
    isActive: z.coerce.boolean().optional(),
    status: DeviceStatusSchema.optional(),
  })
  .strict();

export type UpdateDeviceQuotaBody = z.infer<typeof UpdateDeviceQuotaBodySchema>;
