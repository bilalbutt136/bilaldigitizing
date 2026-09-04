/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
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
        source: '/client',
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
