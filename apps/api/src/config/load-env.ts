import { parseNodeEnv } from '@sms-localblast/validation';

export interface AppEnv {
  nodeEnv: ReturnType<typeof parseNodeEnv>;
  port: number;
}

/**
 * Placeholder for centralized config loading.
 * Replace with validated schema per ADR when Supabase and auth env vars land.
 */
export function loadEnv(): AppEnv {
  return {
    nodeEnv: parseNodeEnv(process.env['NODE_ENV']),
    port: Number(process.env['PORT'] ?? 3000),
  };
}
