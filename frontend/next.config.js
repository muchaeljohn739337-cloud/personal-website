const path = require("path");

const nextConfig = {
  // Only use static export for production builds (Cloudflare Pages)
  ...(process.env.CF_PAGES === "true" && { output: "export" }),
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  typescript: {
    // Disable type checking during builds (run separately)
    ignoreBuildErrors: true,
  },
  // Rewrites only work in dev mode, not with static export
  ...(!process.env.CF_PAGES && {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
            : "http://localhost:4000/api/:path*",
        },
        {
          source: "/socket.io/:path*",
          destination: process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL}/socket.io/:path*`
            : "http://localhost:4000/socket.io/:path*",
        },
      ];
    },
  }),
};

module.exports = nextConfig;
