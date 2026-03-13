import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Base ESLint config for all TypeScript projects
 * Extends: ESLint recommended + TypeScript ESLint + Prettier (disables conflicting rules)
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // TypeScript handles these better
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Allow explicit any sparingly (warn instead of error)
      "@typescript-eslint/no-explicit-any": "warn",

      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
];

export default baseConfig;
