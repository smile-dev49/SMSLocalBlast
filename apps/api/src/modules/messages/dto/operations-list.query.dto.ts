import { z } from 'zod';

export const OperationsListQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(500).default(200),
  })
  .strict();

export type OperationsListQuery = z.infer<typeof OperationsListQuerySchema>;
