import globals from "globals";
import { baseConfig } from "./base.js";

/**
 * ESLint config for Node.js/Express TypeScript services
 * Use in: auth, backend, payment, notification, agent-service, shared
 */
export const nodeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Node.js specific rules
      "no-console": "off", // Allowed in backend services
      "no-process-exit": "off", // Handled by graceful shutdown

      // Async/await best practices
      "require-await": "error",
      "no-return-await": "error",
    },
  },
];

export default nodeConfig;
