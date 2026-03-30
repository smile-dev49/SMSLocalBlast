import { z } from 'zod';

export const ContactListIdParamSchema = z.string().min(1).max(64);
export type ContactListIdParam = z.infer<typeof ContactListIdParamSchema>;
