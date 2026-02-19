import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { baseConfig } from "./base.js";

/**
 * ESLint config for React + TypeScript (Vite)
 * Use in: web app
 */
export const reactConfig = [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React Refresh (for Vite HMR)
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // React specific
      "no-console": "warn", // Discouraged in frontend
    },
  },
];

export default reactConfig;
