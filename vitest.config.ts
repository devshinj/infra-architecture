import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    setupFiles: ["tests/setup.ts"],
    projects: [
      {
        test: {
          name: "node",
          include: ["tests/unit/**/*.test.ts"],
          exclude: ["tests/unit/**/*.test.tsx"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/setup.ts", "tests/integration/setup.ts"],
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "jsdom",
          include: ["tests/unit/**/*.test.tsx"],
          environment: "jsdom",
        },
      },
    ],
  },
});
