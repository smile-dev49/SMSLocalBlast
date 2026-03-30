import { z } from 'zod';

const DeviceStatusSchema = z.enum(['PENDING', 'ONLINE', 'OFFLINE', 'SUSPENDED', 'DISCONNECTED']);

export const DeviceHeartbeatBodySchema = z
  .object({
    status: DeviceStatusSchema,
    batteryLevel: z.coerce.number().int().min(0).max(100).optional(),
    signalStrength: z.coerce.number().int().optional(),
    networkType: z.string().max(60).optional(),
    appVersion: z.string().max(120).optional(),
    payload: z.unknown().optional(),
  })
  .strict();

export type DeviceHeartbeatBody = z.infer<typeof DeviceHeartbeatBodySchema>;
