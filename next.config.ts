import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/recognition/:path*",
        destination: "/passport",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
