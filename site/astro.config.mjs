// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// GitHub Pages serves this repo as a *project page*, i.e. at
// https://dileepadev.github.io/learn-ai-engineering/ — not at the domain root.
// `base` is what makes every generated link and asset URL carry that prefix.
// Get it wrong and the site 404s on Pages while working perfectly in `astro dev`.
const SITE = "https://dileepadev.github.io";
const BASE = "/learn-ai-engineering";

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  trailingSlash: "ignore",
  integrations: [react()],
  markdown: {
    // The lessons are dense with fenced Python. Shiki's dual-theme output lets one
    // build serve both colour schemes via CSS variables, so highlighting follows the
    // site's dark mode without shipping a second copy of every token.
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
    },
  },
  vite: {
    // Tailwind is loaded via postcss.config.mjs — see the note there.
    worker: {
      // The Pyodide worker is an ES module; the default `iife` worker format cannot
      // carry the dynamic import it uses to pull the runtime.
      format: "es",
    },
  },
});
