/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds (we check locally)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
