import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The progress store talks to localStorage and `window`, so its tests need a DOM.
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
