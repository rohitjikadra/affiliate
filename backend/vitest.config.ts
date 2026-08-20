import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/affiliate?schema=public",
      ADMIN_PASSWORD: "test-admin-password",
      SESSION_SECRET: "test-session-secret-which-is-long-enough",
    },
  },
});
