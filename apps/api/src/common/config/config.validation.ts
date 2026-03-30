import type { AppConfig } from './env.schema';
import { parseAppConfig } from './env.schema';

/**
 * Nest `ConfigModule` validate hook — fail fast on invalid environment.
 * Merges `process.env` so `.env` loaded by ConfigModule is included.
 */
export function validateConfiguration(raw: Record<string, unknown>): AppConfig {
  const merged: NodeJS.ProcessEnv = { ...process.env };
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null) continue;
    merged[k] =
      typeof v === 'string'
        ? v
        : typeof v === 'number' || typeof v === 'boolean'
          ? String(v)
          : JSON.stringify(v);
  }
  return parseAppConfig(merged);
}
