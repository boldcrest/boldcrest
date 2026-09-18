import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the boldcrest repo, which has its own lockfile.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
