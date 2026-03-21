import { createApp } from './app.js';
import { env, assertSupabaseConfigured } from './config/env.js';

assertSupabaseConfigured();

const app = createApp();

app.listen(env.port, () => {
  console.log(`SMS LocalBlast API listening on http://localhost:${env.port}`);
  console.log(`Health: http://localhost:${env.port}/api/health`);
});
