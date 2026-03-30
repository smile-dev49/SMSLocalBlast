import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

/**
 * Flat environment variables (process.env). Parsed into nested `AppConfig` via `parseAppConfig`.
 */
export const flatEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().min(1).default('api'),
  APP_NAME: z.string().min(1).default('SMS LocalBlast API'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  BODY_LIMIT: z.string().min(1).default('1mb'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  CORS_ORIGINS: z.string().default('*'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  QUEUE_PREFIX: z.string().min(1).default('sms-localblast'),
  /**
   * When `false`, BullMQ registration is skipped (useful for isolated e2e / local scripts).
   * Default: enabled in real deployments.
   */
  QUEUES_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export type FlatEnv = z.infer<typeof flatEnvSchema>;

export interface AppConfig {
  readonly nodeEnv: z.infer<typeof nodeEnvSchema>;
  readonly port: number;
  readonly app: {
    readonly name: string;
    readonly url: string;
    readonly apiPrefix: string;
    readonly bodyLimit: string;
    readonly trustProxy: boolean;
  };
  readonly database: { readonly url: string };
  readonly redis: { readonly url: string };
  readonly jwt: {
    readonly accessSecret: string;
    readonly refreshSecret: string;
    readonly accessTtlSeconds: number;
    readonly refreshTtlSeconds: number;
  };
  readonly cors: { readonly origins: string[] };
  readonly swagger: { readonly enabled: boolean };
  readonly log: { readonly level: string };
  readonly queue: { readonly prefix: string; readonly enabled: boolean };
}

export function parseAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const flat = flatEnvSchema.parse(env);
  const corsOrigins: string[] =
    flat.CORS_ORIGINS.trim() === '*'
      ? ['*']
      : flat.CORS_ORIGINS.split(',')
          .map((o) => o.trim())
          .filter(Boolean);

  return {
    nodeEnv: flat.NODE_ENV,
    port: flat.PORT,
    app: {
      name: flat.APP_NAME,
      url: flat.APP_URL,
      apiPrefix: flat.API_PREFIX,
      bodyLimit: flat.BODY_LIMIT,
      trustProxy: flat.TRUST_PROXY,
    },
    database: { url: flat.DATABASE_URL },
    redis: { url: flat.REDIS_URL },
    jwt: {
      accessSecret: flat.JWT_ACCESS_SECRET,
      refreshSecret: flat.JWT_REFRESH_SECRET,
      accessTtlSeconds: flat.JWT_ACCESS_TTL,
      refreshTtlSeconds: flat.JWT_REFRESH_TTL,
    },
    cors: { origins: corsOrigins },
    swagger: { enabled: flat.SWAGGER_ENABLED },
    log: { level: flat.LOG_LEVEL },
    queue: { prefix: flat.QUEUE_PREFIX, enabled: flat.QUEUES_ENABLED },
  };
}
