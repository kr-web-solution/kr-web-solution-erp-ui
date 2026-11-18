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
  async rewrites() {
    // Browser never sees the backend host. Next proxies /api → Docker/internal API.
    // Dev:  http://127.0.0.1:8000
    // Prod: http://kr-erp-api:8000  (docker compose service / container name)
    const internalApi = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000').replace(
      /\/$/,
      ''
    );
    return [
      {
        source: '/api/:path*',
        destination: `${internalApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
