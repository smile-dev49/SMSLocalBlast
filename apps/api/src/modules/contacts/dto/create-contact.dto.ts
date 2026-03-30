import { z } from 'zod';

export const CreateContactBodySchema = z
  .object({
    firstName: z.string().min(1).max(120).optional(),
    lastName: z.string().min(1).max(120).optional(),
    fullName: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().min(3).max(40),
    email: z.string().email().max(254).optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.unknown()).optional(),
    source: z.enum(['MANUAL', 'CSV_IMPORT', 'XLSX_IMPORT', 'API', 'EXCEL_ADDIN']).optional(),
  })
  .strict();

export type CreateContactBody = z.infer<typeof CreateContactBodySchema>;
