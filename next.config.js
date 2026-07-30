/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/vector-art',
        destination: '/services/vector-tracing',
      },
      {
        source: '/patches',
        destination: '/custom-patches',
      },
      {
        source: '/dashboard',
        destination: '/client-portal',
      },
      {
        source: '/admin',
        destination: '/admin-portal',
      },
    ];
  },
};

export default nextConfig;
