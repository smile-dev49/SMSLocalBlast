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
  MESSAGE_DISPATCH_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
  MESSAGE_RETRY_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  MESSAGE_MAX_RETRIES_DEFAULT: z.coerce.number().int().nonnegative().default(3),
  MESSAGE_RETRY_BASE_DELAY_SECONDS: z.coerce.number().int().positive().default(30),
  MESSAGE_RETRY_MAX_DELAY_SECONDS: z.coerce.number().int().positive().default(900),
  MESSAGE_DISPATCH_STUCK_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(300),
  MESSAGE_CALLBACK_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(900),
  MESSAGE_RECOVERY_SWEEP_SECONDS: z.coerce.number().int().positive().default(60),
  MESSAGE_RETRY_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  MESSAGE_DEAD_LETTER_THRESHOLD: z.coerce.number().int().positive().default(5),
  STRIPE_SECRET_KEY: z.string().min(1).default('sk_test_local_placeholder_replace_in_production'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default('whsec_local_placeholder_replace_in_production'),
  STRIPE_DEFAULT_CURRENCY: z.string().min(3).default('usd'),
  STRIPE_SUCCESS_URL: z.string().url().default('http://localhost:3001/billing?checkout=success'),
  STRIPE_CANCEL_URL: z.string().url().default('http://localhost:3001/billing?checkout=cancel'),
  STRIPE_BILLING_PORTAL_RETURN_URL: z.string().url().default('http://localhost:3001/billing'),

  // Device heartbeat health (seconds since last heartbeat)
  DEVICE_ONLINE_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(120),
  DEVICE_WARNING_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(600),
  DEVICE_CRITICAL_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(1800),
  DEVICE_GATEWAY_JWT_SECRET: z.string().min(16).optional(),
  DEVICE_GATEWAY_ACCESS_TTL: z.coerce.number().int().positive().default(900),
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
  readonly queue: {
    readonly prefix: string;
    readonly enabled: boolean;
    readonly workers: {
      readonly dispatchConcurrency: number;
      readonly retryConcurrency: number;
    };
    readonly message: {
      readonly maxRetriesDefault: number;
      readonly retryBaseDelaySeconds: number;
      readonly retryMaxDelaySeconds: number;
      readonly dispatchStuckThresholdSeconds: number;
      readonly callbackTimeoutSeconds: number;
      readonly recoverySweepSeconds: number;
      readonly retryBatchSize: number;
      readonly deadLetterThreshold: number;
    };
  };
  readonly device: {
    readonly onlineThresholdSeconds: number;
    readonly warningThresholdSeconds: number;
    readonly criticalThresholdSeconds: number;
  };
  readonly billing: {
    readonly stripe: {
      readonly secretKey: string;
      readonly webhookSecret: string;
      readonly defaultCurrency: string;
      readonly successUrl: string;
      readonly cancelUrl: string;
      readonly billingPortalReturnUrl: string;
    };
  };
  readonly deviceGateway: {
    readonly jwtSecret?: string;
    readonly accessTtlSeconds: number;
  };
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
    queue: {
      prefix: flat.QUEUE_PREFIX,
      enabled: flat.QUEUES_ENABLED,
      workers: {
        dispatchConcurrency: flat.MESSAGE_DISPATCH_WORKER_CONCURRENCY,
        retryConcurrency: flat.MESSAGE_RETRY_WORKER_CONCURRENCY,
      },
      message: {
        maxRetriesDefault: flat.MESSAGE_MAX_RETRIES_DEFAULT,
        retryBaseDelaySeconds: flat.MESSAGE_RETRY_BASE_DELAY_SECONDS,
        retryMaxDelaySeconds: flat.MESSAGE_RETRY_MAX_DELAY_SECONDS,
        dispatchStuckThresholdSeconds: flat.MESSAGE_DISPATCH_STUCK_THRESHOLD_SECONDS,
        callbackTimeoutSeconds: flat.MESSAGE_CALLBACK_TIMEOUT_SECONDS,
        recoverySweepSeconds: flat.MESSAGE_RECOVERY_SWEEP_SECONDS,
        retryBatchSize: flat.MESSAGE_RETRY_BATCH_SIZE,
        deadLetterThreshold: flat.MESSAGE_DEAD_LETTER_THRESHOLD,
      },
    },
    device: {
      onlineThresholdSeconds: flat.DEVICE_ONLINE_THRESHOLD_SECONDS,
      warningThresholdSeconds: flat.DEVICE_WARNING_THRESHOLD_SECONDS,
      criticalThresholdSeconds: flat.DEVICE_CRITICAL_THRESHOLD_SECONDS,
    },
    deviceGateway: {
      ...(flat.DEVICE_GATEWAY_JWT_SECRET ? { jwtSecret: flat.DEVICE_GATEWAY_JWT_SECRET } : {}),
      accessTtlSeconds: flat.DEVICE_GATEWAY_ACCESS_TTL,
    },
    billing: {
      stripe: {
        secretKey: flat.STRIPE_SECRET_KEY,
        webhookSecret: flat.STRIPE_WEBHOOK_SECRET,
        defaultCurrency: flat.STRIPE_DEFAULT_CURRENCY,
        successUrl: flat.STRIPE_SUCCESS_URL,
        cancelUrl: flat.STRIPE_CANCEL_URL,
        billingPortalReturnUrl: flat.STRIPE_BILLING_PORTAL_RETURN_URL,
      },
    },
  };
}
