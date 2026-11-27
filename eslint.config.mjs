import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores([".next/**", "out/**", "coverage/**", "test-results/**", "playwright-report/**", "next-env.d.ts"]),
]);
