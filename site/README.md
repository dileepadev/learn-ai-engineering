# The learning site

The interactive front end for this roadmap — a static [Astro](https://astro.build) app
deployed to GitHub Pages at
**[dileepadev.github.io/learn-ai-engineering](https://dileepadev.github.io/learn-ai-engineering/)**.

No backend, no database, no accounts. Everything runs in the browser.

## What it does

- **A dashboard** that answers the five questions you arrive with: what am I learning, where
  am I, what have I finished, what should I do next, how far along am I overall.
- **Real drills.** Phase 1's exercises are graded by the repo's actual pytest suites, running
  in the browser through [Pyodide](https://pyodide.org) — CPython 3.14 compiled to WebAssembly.
  You get the real assertion, the real traceback, in about a second.
- **Comprehension checks** between each lesson and its drills, aimed at the specific
  misconceptions the lesson warns about.
- **Every part is trackable.** Each skill bullet, project step, and resource in a phase doc
  renders with a checkbox (extracted at build time by `src/lib/parts.ts`), sections have a
  "mark section done" control, and Part A topics can be tested out.
- **A year-end sprint planner** on the dashboard: days left in the edition, hours left, the
  pace it takes, and a finish-by date per phase (`src/lib/sprint.ts`). The edition and its
  deadline live in `src/lib/edition.ts`.
- **Easy to get around.** A course sidebar with live status on every reading page, a
  slide-out menu on phones, "On this page" contents that follow your scroll, breadcrumbs,
  and previous/next links on lessons and phases.
- **Search and shortcuts.** Ctrl/⌘K or `/` searches every phase, lesson, and section
  (`src/lib/search.ts`, over an index built into `search-index.json`). `←`/`→` move between
  lessons and phases, and `?` lists the shortcuts. Single-key shortcuts never fire while you
  type or inside the drill editor (`src/lib/keys.ts`).
- **Progress that persists**, in `localStorage`, with export/import so it is not trapped in
  one browser. The labelled **Progress** button in the header opens a per-phase breakdown.

## The one rule

**`phases/` is the source of truth. This site is derived from it.**

To fix a lesson, edit the markdown in `phases/` — never the site. `src/generated/` is
rebuilt on every build and is gitignored, so it cannot go stale.

| Content | Where it comes from |
| --- | --- |
| Roadmap docs and Part A lessons | `phases/**/*.md`, read at build time by `src/lib/loaders.ts` |
| Drills, tests, solutions | `scripts/export_curriculum.py` → `src/generated/` |
| Comprehension checks | `src/content/checks.json` — the only site-authored content |

## Commands

```bash
npm install

npm run dev             # export the curriculum, then serve with hot reload
npm run build           # prebuild exports, then builds to dist/
npm run preview         # serve dist/ exactly as Pages will
npm run check           # astro check (TypeScript)
npm run test            # vitest: progress store, completion math, links, search, shortcuts
npm run verify:drills   # run all 207 Part A tests through Pyodide
npm run verify:pages    # sweep every page for console errors and a11y issues
npm run verify:browser  # end-to-end in a real browser
```

The last two need a server already running (`npm run dev` or `npm run preview`).

`npm run dev` and `npm run build` shell out to `uv`, because the exporter is Python. Run
`uv sync` at the repo root first.

### `verify:drills` is the one that matters

The site's whole premise is that the repo's pytest suites run in a browser. Nothing else
catches a change that breaks that — `uv run pytest` passes on CPython whether or not WASM
agrees, and an Astro build never executes a drill. This script does three things per topic:

1. Reassembles the drill module from its exported parts and checks it reproduces the file on
   disk (so the editor shows what actually runs).
2. Runs the suite against the answer key in Pyodide and requires every test to pass.
3. Requires every test to map to an exercise, since an unmapped test's result would never
   reach the UI.

CI runs it on every deploy.

`verify:browser` goes one step further and drives a real Firefox through Playwright: it
types an answer into the editor, boots Pyodide, runs the suite, and checks the pass is
written to `localStorage` and survives a reload. It also checks search, arrow-key
navigation (and that arrows inside the editor never leave the page), the Progress button,
and the phone menu. It needs a preview server running, so it is a local check rather than
a CI step. Both browser scripts need Playwright's Firefox once: `npx playwright install firefox`.

Astro 7's `astro dev` and `astro preview` may start in the background. If they return at
once, `npx astro dev logs` shows the output and `npx astro dev stop` stops the server
(likewise `preview`).

## Architecture notes

- **A Web Worker hosts Pyodide.** `pytest.main()` blocks; on the main thread it would freeze
  the page. The worker boots on idle when a lesson loads, so the runtime is warm by the time
  you scroll to the drills. Learner code executes inside the WASM sandbox — no network, no
  host filesystem.
- **`src/workers/driver.py` is shared** between the worker and `verify:drills`, imported as
  raw text, so the code the browser runs is the code CI exercises.
- **The payload is split.** Drill, solution, and test source is ~340KB across the twelve
  topics; the dashboard needs none of it. `curriculum.json` is a 13KB index every page loads,
  and `topics/<id>.json` is fetched only on the lesson page that needs it.
- **Some drills omit an import on purpose** — topic 09 expects you to reach for `functools`,
  topic 08 for `itertools.islice`. The UI therefore exposes an editable module preamble.
  Without it those topics would be impossible to finish here.
- **Tailwind runs as a Vite plugin** (`@tailwindcss/vite`). Under Astro 6 it went through
  PostCSS, because Astro nested its own Vite and the plugin bound to the wrong copy. Astro 7
  is on Vite 8 with a single Vite in the tree (`npm ls vite`), and Vite 8 broke the PostCSS
  route. If `npm ls vite` ever shows two copies, expect the build to break again.
- **Phase counts ship once per page**, as JSON in `Base.astro`, read by `usePhaseCounts()`.
  Passing them as island props would embed ~15KB per island.
- **The header must not move on hydration.** Progress and the theme are only known in the
  browser, so the server-rendered header has to take exactly the same space as the
  hydrated one, or every page change jumps. `HeaderProgress` uses fixed-size slots and
  `ThemeToggle` picks its icon with CSS, not React state.
- **The type scale lives in `@theme` in `src/styles/global.css`**: `text-xs` is 14px and
  `text-sm` 15px, a notch above Tailwind's defaults, so interface text reads comfortably
  next to 17px lesson prose. Change it there, not per component.

## Deployment

Pushes to `main` that touch `phases/`, `site/`, or the exporter trigger
`.github/workflows/deploy-site.yml`.

**One-time setup:** repo Settings → Pages → Source → **GitHub Actions**.
