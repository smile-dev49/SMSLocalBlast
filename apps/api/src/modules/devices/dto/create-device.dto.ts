import { z } from 'zod';

const DevicePlatformSchema = z.enum(['ANDROID', 'IOS']);

const JsonObjectSchema = z.record(z.unknown());

export const CreateDeviceBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    platform: DevicePlatformSchema,
    deviceIdentifier: z.string().min(3).max(255),

    appVersion: z.string().max(120).optional(),
    osVersion: z.string().max(120).optional(),
    deviceModel: z.string().max(120).optional(),

    phoneNumber: z.string().max(40).optional(),
    simLabel: z.string().max(80).optional(),
    pushToken: z.string().max(512).optional(),

    capabilities: JsonObjectSchema.optional(),
  })
  .strict();

export type CreateDeviceBody = z.infer<typeof CreateDeviceBodySchema>;
