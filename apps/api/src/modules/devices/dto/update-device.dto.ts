import { z } from 'zod';

const JsonObjectSchema = z.record(z.unknown());

export const UpdateDeviceBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().max(40).optional(),
    simLabel: z.string().max(80).optional(),
    pushToken: z.string().max(512).optional(),

    appVersion: z.string().max(120).optional(),
    osVersion: z.string().max(120).optional(),
    deviceModel: z.string().max(120).optional(),

    metadata: JsonObjectSchema.optional(),
    capabilities: JsonObjectSchema.optional(),
  })
  .strict();

export type UpdateDeviceBody = z.infer<typeof UpdateDeviceBodySchema>;
