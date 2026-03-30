import { z } from 'zod';

export const UpdateContactBodySchema = z
  .object({
    firstName: z.string().min(1).max(120).optional(),
    lastName: z.string().min(1).max(120).optional(),
    fullName: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().min(3).max(40).optional(),
    email: z.string().email().max(254).optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.unknown()).optional(),
    status: z.enum(['ACTIVE', 'BLOCKED', 'OPTED_OUT', 'ARCHIVED']).optional(),
  })
  .strict();

export type UpdateContactBody = z.infer<typeof UpdateContactBodySchema>;
