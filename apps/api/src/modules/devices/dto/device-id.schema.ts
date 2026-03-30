import { z } from 'zod';

export const DeviceIdParamSchema = z.string().min(1).max(64);

export type DeviceIdParam = z.infer<typeof DeviceIdParamSchema>;
