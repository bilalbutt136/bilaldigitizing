export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin-portal/', '/admin/', '/client-portal/', '/client/', '/api/', '/secure-admin-login/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
