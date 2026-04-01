export type AppEnv = 'development' | 'production' | 'test';

function readPublicEnv(key: string): string | undefined {
  if (typeof process.env[key] === 'string') {
    return process.env[key];
  }
  return undefined;
}

/** Resolve Swagger UI URL from API base (…/api/v1 → origin + /api/docs). */
export function swaggerUiUrlFromApiBase(apiBaseUrl: string): string {
  try {
    const u = new URL(apiBaseUrl);
    return `${u.origin}/api/docs`;
  } catch {
    return '/api/docs';
  }
}

/** API base including `/api/v1` (browser calls). */
export const publicEnv = {
  apiBaseUrl: readPublicEnv('NEXT_PUBLIC_API_BASE_URL') ?? 'http://localhost:3000/api/v1',
  appUrl: readPublicEnv('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3001',
  appName: readPublicEnv('NEXT_PUBLIC_APP_NAME') ?? 'SMS LocalBlast Admin',
  nodeEnv: (readPublicEnv('NODE_ENV') ?? 'development') as AppEnv,
} as const;

export const isDevDiagnosticsEnabled = publicEnv.nodeEnv === 'development';
