// Tailwind is wired through PostCSS rather than its Vite plugin on purpose.
//
// `@tailwindcss/vite` imports Vite's internals directly, and Astro pins its own nested
// Vite copy — so the plugin bound to a different Vite than the one running the build and
// crashed on a native-binding mismatch. PostCSS has no such coupling, which also means
// this keeps working across future Astro and Vite bumps.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
