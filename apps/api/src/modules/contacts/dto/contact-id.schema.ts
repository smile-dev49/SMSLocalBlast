import { z } from 'zod';

export const ContactIdParamSchema = z.string().min(1).max(64);
export type ContactIdParam = z.infer<typeof ContactIdParamSchema>;
