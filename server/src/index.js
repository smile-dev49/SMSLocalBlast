import { createApp } from './app.js';
import { env, assertSupabaseConfigured } from './config/env.js';
import {
  isLicenseCheckEnabled,
  assertValidLicense,
  scheduleNextCheck,
} from './lib/licenseGuard.js';

assertSupabaseConfigured();

async function start() {
  if (isLicenseCheckEnabled() && !process.env.SKIP_LICENSE_CHECK) {
    await assertValidLicense();
    scheduleNextCheck();
  }

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`SMS LocalBlast API listening on http://localhost:${env.port}`);
    console.log(`Health: http://localhost:${env.port}/api/health`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
