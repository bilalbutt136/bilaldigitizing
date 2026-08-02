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
  async redirects() {
    return [
      {
        source: '/embroidery-digitizing',
        destination: '/services/embroidery-digitizing',
        permanent: true,
      },
      {
        source: '/calculator',
        destination: '/services/embroidery-digitizing',
        permanent: true,
      },
      {
        source: '/custom-tshirts',
        destination: '/custom-patches',
        permanent: true,
      },
      {
        source: '/custom-caps',
        destination: '/custom-patches',
        permanent: true,
      },
      {
        source: '/system-access',
        destination: '/secure-admin-login',
        permanent: true,
      },
      {
        source: '/services',
        destination: '/#sew-outs',
        permanent: true,
      },
      {
        source: '/formats',
        destination: '/#sew-outs',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/#faqs',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
