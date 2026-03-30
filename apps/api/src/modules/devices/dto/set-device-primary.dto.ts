import { z } from 'zod';

export const SetDevicePrimaryBodySchema = z.object({}).strict();

export type SetDevicePrimaryBody = z.infer<typeof SetDevicePrimaryBodySchema>;
