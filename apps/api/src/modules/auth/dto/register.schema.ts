import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((v) => /[a-z]/.test(v), 'Password must include at least one lowercase letter')
  .refine((v) => /[A-Z]/.test(v), 'Password must include at least one uppercase letter')
  .refine((v) => /[0-9]/.test(v), 'Password must include at least one number');

export const RegisterBodySchema = z
  .object({
    organizationName: z.string().min(1).max(200),
    organizationSlug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email().max(254),
    password: passwordSchema,
  })
  .strict();

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
