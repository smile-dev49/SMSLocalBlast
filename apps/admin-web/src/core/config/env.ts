export type AppEnv = 'development' | 'production' | 'test';

function readPublicEnv(key: string): string | undefined {
  if (typeof process.env[key] === 'string') {
    return process.env[key];
  }
  return undefined;
}

/** API base including `/api/v1` (browser calls). */
export const publicEnv = {
  apiBaseUrl: readPublicEnv('NEXT_PUBLIC_API_BASE_URL') ?? 'http://localhost:3000/api/v1',
  appName: readPublicEnv('NEXT_PUBLIC_APP_NAME') ?? 'SMS LocalBlast Admin',
  nodeEnv: (readPublicEnv('NODE_ENV') ?? 'development') as AppEnv,
} as const;

export const isDevDiagnosticsEnabled = publicEnv.nodeEnv === 'development';
