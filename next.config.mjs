/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Legacy → flat ERP routes
      { source: '/app', destination: '/dashboard', permanent: false },
      { source: '/app/projects', destination: '/projects', permanent: false },
      { source: '/app/projects/:path*', destination: '/projects/:path*', permanent: false },
      { source: '/app/clients', destination: '/clients', permanent: false },
      { source: '/app/clients/:path*', destination: '/clients/:path*', permanent: false },
      { source: '/pipeline', destination: '/dashboard', permanent: false },
      { source: '/pipeline/:path*', destination: '/dashboard', permanent: false },
      { source: '/app/pipeline', destination: '/dashboard', permanent: false },
      { source: '/app/pipeline/:path*', destination: '/dashboard', permanent: false },
      { source: '/app/crm/leads', destination: '/leads', permanent: false },
      { source: '/app/crm/leads/:path*', destination: '/leads/:path*', permanent: false },
      { source: '/app/finance/invoices', destination: '/invoices', permanent: false },
      { source: '/app/finance/invoices/:path*', destination: '/invoices/:path*', permanent: false },
      { source: '/app/settings', destination: '/settings', permanent: false },
      { source: '/app/settings/:path*', destination: '/settings', permanent: false },
      { source: '/crm/leads', destination: '/leads', permanent: false },
      { source: '/crm/leads/:path*', destination: '/leads/:path*', permanent: false },
      { source: '/finance/invoices', destination: '/invoices', permanent: false },
      { source: '/finance/invoices/:path*', destination: '/invoices/:path*', permanent: false },
      { source: '/settings/company', destination: '/settings', permanent: false },
    ];
  },
  // /api/* is proxied at runtime by app/api/[...path]/route.ts (reads API_INTERNAL_URL).
  // Do not use next.config rewrites — those are baked at build time and break Dokploy.
};

export default nextConfig;
