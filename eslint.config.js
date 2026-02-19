import nodeConfig from "@joblensai/eslint-config/node";
import reactConfig from "@joblensai/eslint-config/react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/dist", "**/node_modules", "**/.next", "**/build"]),

  // React app (web)
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    ...reactConfig[0],
  },
  ...reactConfig.slice(1).map((config) => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx}"],
  })),

  // Node.js apps (all backend services + shared)
  {
    files: [
      "apps/auth/**/*.ts",
      "apps/backend/**/*.ts",
      "apps/payment/**/*.ts",
      "apps/notification/**/*.ts",
      "apps/agent-service/**/*.ts",
      "packages/shared/**/*.ts",
    ],
    ...nodeConfig[0],
  },
  ...nodeConfig.slice(1).map((config) => ({
    ...config,
    files: [
      "apps/auth/**/*.ts",
      "apps/backend/**/*.ts",
      "apps/payment/**/*.ts",
      "apps/notification/**/*.ts",
      "apps/agent-service/**/*.ts",
      "packages/shared/**/*.ts",
    ],
  })),
]);
