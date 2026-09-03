import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'cjemqzifnhdhynsolrjq.supabase.co',
      },
    ],
  },
};

export default nextConfig;
