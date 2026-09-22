import path from "node:path";
import type { NextConfig } from "next";

// clinic/ is a pnpm workspace (pnpm-workspace.yaml + pnpm-lock.yaml live there),
// nested inside the boldcrest repo, which has its own separate lockfile for the
// marketing site at the repo root. outputFileTracingRoot pins file tracing to
// the clinic workspace root so Next does not walk up into the marketing site.
const workspaceRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  // Workspace packages are consumed as TypeScript source, no build step of
  // their own. Turbopack (the default bundler in Next 16) already transpiles
  // workspace packages automatically, but this is kept explicit so an app
  // build stays correct if it ever falls back to `next build --webpack`.
  transpilePackages: ["@clinic/core", "@clinic/ui", "@clinic/i18n", "@clinic/db"],
};

export default nextConfig;
