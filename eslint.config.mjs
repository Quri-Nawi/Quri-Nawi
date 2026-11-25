import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);
