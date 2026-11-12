import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The progress store talks to localStorage and `window`, so its tests need a DOM.
    environment: "jsdom",
    // Node 25+ turns on its own Web Storage by default: a global `localStorage` getter that
    // returns `undefined` unless `--localstorage-file` is set. It shadows jsdom's, so every
    // progress test died on `localStorage.clear()`. Switching Node's version off lets jsdom
    // provide it. This is the flag's original name; Node 26 also accepts `--no-webstorage`,
    // but Node 24 (CI) only knows this one and would refuse to start the worker.
    execArgv: ["--no-experimental-webstorage"],
    include: ["src/**/*.test.ts"],
  },
});
