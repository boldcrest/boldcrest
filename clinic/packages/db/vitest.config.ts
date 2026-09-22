import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Tests share one PGlite instance per file via the harness; keep files
    // isolated from each other but run them one at a time to avoid spinning
    // up many in-memory Postgres instances at once.
    fileParallelism: false,
  },
});
