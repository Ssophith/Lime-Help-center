import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next/core-web-vitals.js";

const config = Array.isArray(nextConfig) ? nextConfig : (nextConfig ? [nextConfig] : []);

export default defineConfig([
  ...config,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
