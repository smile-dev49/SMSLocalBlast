import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(rootDir, 'src'),
      // Bundle TypeScript source so Vite does not depend on CJS named-export interop from `dist`.
      '@sms-localblast/types': path.join(rootDir, '../../packages/types/src/index.ts'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
