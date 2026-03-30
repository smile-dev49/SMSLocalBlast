/**
 * E2E Jest config — runs before test files load so `AppModule` env validation sees defaults.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '3000';
process.env.API_PREFIX = process.env.API_PREFIX ?? 'api';
process.env.APP_NAME ??= 'SMS LocalBlast API E2E';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.BODY_LIMIT ??= '1mb';
process.env.TRUST_PROXY ??= 'false';
process.env.CORS_ORIGINS ??= '*';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:5432/sms-localblast';
process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret-min-16-chars';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret-min-16-chars';
process.env.JWT_ACCESS_TTL ??= '900';
process.env.JWT_REFRESH_TTL ??= '2592000';
process.env.SWAGGER_ENABLED ??= 'false';
process.env.LOG_LEVEL ??= 'silent';
process.env.QUEUE_PREFIX ??= 'sms-localblast-test';
process.env.QUEUES_ENABLED ??= 'false';

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  testTimeout: 20000,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@sms-localblast/constants$': '<rootDir>/../../packages/constants/dist/index.js',
    '^@sms-localblast/validation$': '<rootDir>/../../packages/validation/dist/index.js',
  },
  testEnvironment: 'node',
};
