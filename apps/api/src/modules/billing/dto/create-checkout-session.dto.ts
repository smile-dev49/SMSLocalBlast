import { z } from 'zod';

export const CreateCheckoutSessionBodySchema = z
  .object({
    planCode: z.string().min(1).optional(),
    priceId: z.string().min(1).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.planCode ?? v.priceId), {
    message: 'Either planCode or priceId is required',
  });

export type CreateCheckoutSessionBody = z.infer<typeof CreateCheckoutSessionBodySchema>;
