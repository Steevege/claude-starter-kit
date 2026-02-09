import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.marmiton.org',
      },
      {
        protocol: 'https',
        hostname: '*.750g.com',
      },
      {
        protocol: 'https',
        hostname: '*.cuisineaz.com',
      },
    ],
  },
};

export default nextConfig;
