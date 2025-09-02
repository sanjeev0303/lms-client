import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Reduce friction: treat these as warnings during migration
      "@typescript-eslint/no-explicit-any": "warn",
      // Apostrophes in JSX text shouldn't fail the build
      "react/no-unescaped-entities": "off",
      // Allow dynamic import patterns; we already removed require usages where needed
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
