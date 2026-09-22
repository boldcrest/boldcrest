import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// @clinic/ui has React components (ui.tsx, viz.tsx), so it needs the same
// react-hooks rules as the app (including react-hooks/set-state-in-effect).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["dist/**"]),
]);

export default eslintConfig;
