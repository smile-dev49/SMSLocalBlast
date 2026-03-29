import type { NextConfig } from 'next';

/** `standalone` tracing uses symlinks that fail on Windows without elevated/dev-mode permissions. */
const enableStandaloneOutput =
  process.env['NEXT_STANDALONE_OUTPUT'] === 'true' || process.platform !== 'win32';

const nextConfig: NextConfig = {
  ...(enableStandaloneOutput ? { output: 'standalone' as const } : {}),
  transpilePackages: ['@sms-localblast/ui', '@sms-localblast/types'],
  reactStrictMode: true,
};

export default nextConfig;
