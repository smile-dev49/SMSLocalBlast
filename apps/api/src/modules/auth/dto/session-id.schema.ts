import { z } from 'zod';

export const SessionIdParamSchema = z.string().min(1).max(64);
