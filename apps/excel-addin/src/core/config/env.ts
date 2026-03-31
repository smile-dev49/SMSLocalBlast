export type AppEnv = 'dev' | 'staging' | 'prod';

export interface RuntimeConfig {
  apiBaseUrl: string;
  appName: string;
  env: AppEnv;
}

const env = import.meta.env as unknown as Record<string, unknown>;
const envValue = (env['VITE_APP_ENV'] ?? 'dev') as AppEnv;
const rawApiBaseUrl = env['VITE_API_BASE_URL'];
const rawAppName = env['VITE_APP_NAME'];

const apiBaseUrl =
  typeof rawApiBaseUrl === 'string' ? rawApiBaseUrl : 'http://localhost:3000/api/v1';
const appName = typeof rawAppName === 'string' ? rawAppName : 'sms-localblast-excel-addin';

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl,
  appName,
  env: envValue,
};
