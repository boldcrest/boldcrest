import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async redirects() {
    return [
      // The Privacy Notice page used to live at /privacy-policy. Permanently
      // redirect the old path so existing/cached links keep resolving.
      {
        source: "/privacy-policy",
        destination: "/privacy-notice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
