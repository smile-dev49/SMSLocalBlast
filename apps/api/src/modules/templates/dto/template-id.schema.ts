import { z } from 'zod';

export const TemplateIdParamSchema = z.string().min(1).max(64);
