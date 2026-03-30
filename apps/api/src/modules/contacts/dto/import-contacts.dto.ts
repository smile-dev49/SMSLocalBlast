import { z } from 'zod';

const mappingSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    phoneNumber: z.string(),
    email: z.string().optional(),
    customFields: z.record(z.string()).optional(),
  })
  .strict();

const optionsSchema = z
  .object({
    deduplicateByPhone: z.coerce.boolean().default(true),
    createListName: z.string().min(1).max(160).optional(),
    skipInvalidRows: z.coerce.boolean().default(true),
    updateExisting: z.coerce.boolean().default(false),
  })
  .strict();

export const ImportContactsBodySchema = z
  .object({
    sourceType: z.enum(['CSV_IMPORT', 'XLSX_IMPORT', 'EXCEL_ADDIN']),
    rows: z.array(z.record(z.unknown())).max(10000),
    mapping: mappingSchema,
    options: optionsSchema,
  })
  .strict();

export type ImportContactsBody = z.infer<typeof ImportContactsBodySchema>;
