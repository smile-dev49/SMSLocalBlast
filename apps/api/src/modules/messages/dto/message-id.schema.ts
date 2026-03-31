import { z } from 'zod';

export const MessageIdParamSchema = z.string().min(1);
