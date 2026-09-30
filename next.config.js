/** @type {import('next').NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://connect.facebook.net https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://res.cloudinary.com https://images.unsplash.com https://accounts.google.com https://www.facebook.com https://graph.facebook.com https://api.stripe.com https://checkout.stripe.com",
  "frame-src 'self' blob: https://*.supabase.co https://res.cloudinary.com https://accounts.google.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests"
].join('; ');

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
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy
          },
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
        source: '/order',
        destination: '/?app=true&tab=home',
        permanent: false,
      },
      {
        source: '/orders',
        destination: '/?app=true&tab=orders',
        permanent: false,
      },
      {
        source: '/chat',
        destination: '/?app=true&tab=inbox',
        permanent: false,
      },
      {
        source: '/inbox',
        destination: '/?app=true&tab=inbox',
        permanent: false,
      },
      {
        source: '/messages',
        destination: '/?app=true&tab=inbox',
        permanent: false,
      },
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
        destination: '/#services',
        permanent: true,
      },
      {
        source: '/formats',
        destination: '/#services',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/faqs',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
