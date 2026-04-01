import type { NextConfig } from 'next';

/** `standalone` tracing uses symlinks that fail on Windows without elevated/dev-mode permissions. */
const enableStandaloneOutput =
  process.env['NEXT_STANDALONE_OUTPUT'] === 'true' || process.platform !== 'win32';

const nextConfig: NextConfig = {
  ...(enableStandaloneOutput ? { output: 'standalone' as const } : {}),
  reactStrictMode: true,
  /** ESLint project references do not include co-located Vitest files; run `pnpm --filter @sms-localblast/admin-web lint` in CI. */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
