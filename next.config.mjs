/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['@prisma/client'],
  async redirects() {
    return [
      // The dashboard was removed; its functions now live under Projects and Account.
      { source: '/dashboard', destination: '/account', permanent: false },
      { source: '/dashboard/submit', destination: '/projects/submit', permanent: false },
      { source: '/dashboard/submissions', destination: '/account', permanent: false },
      { source: '/dashboard/profile', destination: '/account', permanent: false },
      // Explore was renamed to Ships.
      { source: '/explore', destination: '/ships', permanent: false },
    ];
  },
};

export default nextConfig;
