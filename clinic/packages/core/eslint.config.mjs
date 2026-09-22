import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";

// @clinic/core is plain TypeScript (no React, no DOM), so it only needs the
// TypeScript rules from eslint-config-next, not core-web-vitals.
const eslintConfig = defineConfig([
  ...nextTs,
  globalIgnores(["dist/**"]),
]);

export default eslintConfig;
