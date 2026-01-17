/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'remotion',
    '@remotion/player',
    '@remotion/cli',
    '@remotion/zod-types',
  ],
  // Turbopack config (Next.js 16 default)
  turbopack: {},
  // Webpack fallback for Remotion compatibility
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
