import { z } from 'zod';

export const LoginBodySchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(200),
    organizationSlug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    deviceFingerprint: z.string().min(1).max(512).optional(),
  })
  .strict();

export type LoginBody = z.infer<typeof LoginBodySchema>;
