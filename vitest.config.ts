import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
})
