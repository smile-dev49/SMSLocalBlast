import { z } from 'zod';

const ContactCustomFieldSchema = z
  .object({
    fieldKey: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
    fieldValue: z.string().max(2000),
    valueType: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'JSON']),
  })
  .strict();

export const UpsertContactCustomFieldsBodySchema = z
  .object({
    fields: z.array(ContactCustomFieldSchema).max(200),
  })
  .strict();

export type UpsertContactCustomFieldsBody = z.infer<typeof UpsertContactCustomFieldsBodySchema>;
