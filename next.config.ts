import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hjooyakizppoowrojubs.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.fal.media",
      },
      {
        protocol: "https",
        hostname: "fal.media",
      },
    ],
  },
};

export default nextConfig;
