import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";

// @clinic/i18n is plain TypeScript (dictionaries and format helpers), no React.
const eslintConfig = defineConfig([
  ...nextTs,
  globalIgnores(["dist/**"]),
]);

export default eslintConfig;
