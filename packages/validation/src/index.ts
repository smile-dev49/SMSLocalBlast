import { z } from 'zod';

/** Minimal env schema placeholder — extend per service in future ADRs. */
export const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export function parseNodeEnv(value: string | undefined): NodeEnv {
  const parsed = nodeEnvSchema.safeParse(value ?? 'development');
  if (!parsed.success) {
    throw new Error(`Invalid NODE_ENV: ${value ?? '(undefined)'}`);
  }
  return parsed.data;
}
