# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

New features and improvements are being actively developed for the next release, the `2027 edition` (`v1.0.0`).

## [1.0.0-beta.1] - 2026-11-12

The **2026 edition**, released as a preview: the fast, hands-on pass over the roadmap, built to be finished by 31 December 2026. It is a pre-release because the 2027 edition, the complete, in-depth curriculum, will be the first stable release, `v1.0.0`. Fixes to this edition ship as `v1.0.0-beta.2`, `beta.3`, and so on (see "Editions" in `AGENTS.md`).

### Added

- **Site navigation redesign.** The site already tracked progress well, but it was hard to get around: "Phases" always opened Phase 1, long pages had no contents, lessons did not show their neighbours, and phones lost header links outright. Now:
  - **Course sidebar** on phase, lesson, and role pages: all eight phases with live status, Phase 1's twelve topics nested (open automatically when you are in Part A), and the current page highlighted and scrolled into view.
  - **Mobile menu**: a native `<dialog>` drawer with the main links, the progress gauge, and the same course tree. Nothing is dropped from the header at narrow widths any more; it moves here.
  - **"On this page"** beside long pages from 1280px, highlighting the section being read, with a folded version above the text on narrower screens and a thin reading-progress bar under the header.
  - **Search (Ctrl/⌘K or `/`)**: a palette over every phase, lesson, and section heading (191 entries), built at build time into `search-index.json` and fetched on first open. With an empty query it offers "continue where you left off", the theme toggle, and shortcuts. Ranking is a small hand-written scorer (`src/lib/search.ts`) instead of a dependency.
  - **Keyboard shortcuts**: `←`/`→` for previous/next lesson or phase, `?` for a help dialog (also linked in the footer). All of them go through `src/lib/keys.ts`, which keeps them out of text fields, the drill editor, open dialogs, and sideways-scrolling tables.
  - **Breadcrumbs** on phase, lesson, and role pages; previous/next cards on phase pages; "You are here" on the dashboard's current phase; a "Roadmap" header link to the dashboard's phase list.
  - **Polish**: cross-fade page transitions (CSS cross-document View Transitions, only when reduced motion is off), a short celebration when a topic or phase becomes complete during a visit, and one shared hover style for cards.
  - Phase counts are embedded once per page as JSON instead of once per island, so the extra islands add no weight: the About page stays at 53KB with the menu, search, and shortcuts included.
  - Tests: `keys.test.ts`, `search.test.ts`, `href.test.ts`; `smoke.mjs` now also checks search, arrow-key navigation (including that arrows inside the drill editor never leave the page), and the mobile menu.
- **Every part of every phase is trackable.** Each top-level list item in a phase doc — skill bullets, project steps, resources — becomes a checkbox on the site, with a per-section "mark section done" control. Parts are extracted at build time by `site/src/lib/parts.ts` and keyed by a hash of their wording, so inserting a bullet never shifts saved ticks; the build fails if parts and rendered checkboxes disagree. `<!-- track: off -->` opts a section out (Phase 8's "Alternatives").
- **Test out of Part A topics.** An "I already know this" toggle on each lesson counts the topic as complete without touching drill results, and is shown as "tested out", never as "passed".
- **2026 sprint planner** on the dashboard: a countdown to 31 December 2026, the hours left (each phase's effort budget scaled by what is still unticked), the hours a week needed, a finish-by date per phase, and an on-track/behind check against the hours a week you enter.
- **`/role` page and `phases/the-role.md`**: the 2026 research on the AI Engineer role — definition, how it differs from ML engineering and data science, what postings ask for mapped to the phase that teaches it, practitioner survey data, titles including forward deployed engineer, US pay, interview loops, and what this roadmap leaves out on purpose — with every figure linked to its source and checked on 4 November 2026.
- Phase 8 **"Turning it into a job"**: LLM system design practice, coding rounds with and without AI tools, a timed take-home, portfolio write-ups, behavioral stories, and titles to target — plus a new "Done means" criterion (appended, so saved ticks are unaffected).
- `site/src/lib/edition.ts` — the edition, its deadline, and the next edition, in one place.
- README sections **"What the 2026 market asks for"** and **"Finishing in 2026"**; a matching market table and edition notes on the About page; edition labels in the header, footer, and dashboard.
- Tests: `parts.test.ts` (extraction rules, key stability, and every real phase doc rendering one box per part), `sprint.test.ts` (calendar arithmetic and the planner, on fixed dates), plus new cases in `progress.test.ts`, `curriculum.test.ts`, and `links.test.ts`.

- Interactive learning site under `site/` — a static Astro app deployed to GitHub Pages at [dileepadev.github.io/learn-ai-engineering](https://dileepadev.github.io/learn-ai-engineering/). A dashboard answering where you are and what to do next, pages for all eight phases with tickable exit criteria, and the twelve Part A lessons with in-browser drills. Progress lives in `localStorage` with JSON export/import; there is no backend, database, or account. Light and dark themes.
- In-browser drill runner: the repo's real pytest suites execute against your code via Pyodide (CPython 3.14 on WebAssembly) in a Web Worker, with per-exercise pass/fail and real tracebacks. All 207 Part A tests run unmodified. Because several drills deliberately omit an import — remembering `functools` is part of exercise 9.1 — the module preamble is editable alongside each exercise.
- `scripts/export_curriculum.py` — parses the drills, tests, and solutions with Python's `ast` and emits the JSON the site consumes, including the test-to-exercise mapping that drives per-exercise progress. Keeps `phases/` the single source of truth; output is gitignored and regenerated on every build.
- 36 comprehension checks (`site/src/content/checks.json`), three per Part A topic, drawn from the gotchas each lesson calls out. Every option explains why it is right or wrong.
- `site/scripts/verify-drills.mjs` (`npm run verify:drills`) — runs every Part A test through Pyodide against the answer key, and checks that the site's module assembly reproduces the on-disk drill files. Catches breakage that `uv run pytest` cannot see, since it passes on CPython whether or not WebAssembly agrees.
- `site/scripts/audit-pages.mjs` (`npm run verify:pages`) — visits every page type, hydrates every island, and reports console errors, failed requests, and accessibility problems.
- `site/scripts/smoke.mjs` (`npm run verify:browser`) — drives a real browser end to end: types an answer, boots Pyodide, runs the suite, and confirms the pass persists across a reload.
- `.github/workflows/deploy-site.yml` — type-checks, tests, builds, verifies the drills under Pyodide, and deploys to GitHub Pages.
- Phase 1 Part A learning module under `phases/01-foundations/part-a/` — twelve topics, each with a lesson, a drill file of typed stubs, a pytest specification, and a commented reference solution. Topic 00 covers Python from scratch (variables, numbers, strings, conditionals, loops) for use as a refresher or a first encounter.
- Postgres container, seeded schema, and query drills for the Part A SQL topic (`phases/01-foundations/part-a/sql/`).

### Changed

- **Progress is easy to find.** The only route to it was an unlabelled mini-bar in the header, shown only from 1024px up, so people did not know it was clickable and phones had no way in apart from the footer. The header now has a labelled **Progress** button showing your percentage at every width, phones included. The dashboard's progress ring links to the page and says "See your progress →", and the menu drawer and footer say "Your progress" instead of "Manage progress". The page itself leads with what people came for, which is the overall ring, a Continue button, and a bar and breakdown for each phase, with backup, import, and reset below. On tablets (768–1023px) the Role link moves into the menu to make room. `smoke.mjs` checks the button on desktop and on a phone.
- **Larger interface text on the site.** Lesson prose was already 17px, but the labels, hints, badges, nav links, and card descriptions around it rendered at Tailwind's 12px `text-xs` and 14px `text-sm`, which read as small beside it. The two tokens are redefined once in `global.css` (`text-xs` 12px → 14px, `text-sm` 14px → 15px), which moves all of their uses together. One-off sizes were raised to match: keycaps, the 11px edition and progress labels, quiz options and code, inline code in drill specs, the drill editor (13.7px → 15px), and table text. Nothing on the site now renders below 13px. The course sidebar is a little wider (16rem → 18rem), and long phase and topic titles now wrap onto a second line instead of being cut off with "…". Checked on all pages at 320, 390, 768, 1024, and 1440px in both themes: no sideways scrolling, and the header stays on one row.
- **Site upgraded to Astro 7** (7.4.11, from 6.4.8), with `@astrojs/react` 7 and Vite 8. Tailwind now runs through `@tailwindcss/vite` instead of `@tailwindcss/postcss`: Vite 8 resolves CSS `@import`s before PostCSS plugins run and could not resolve `@import "tailwindcss"`, and the nested-Vite problem that forced PostCSS is gone now that the tree has a single Vite. The `vite: ^7` override and `postcss.config.mjs` are removed. `compressHTML: true` keeps Astro 6's whitespace handling, because Astro 7's new `"jsx"` default dropped the space before wrapped inline elements ("generated fromphases/"). Lessons now render through Astro 7's Sätteri Markdown processor. Every page's HTML was diffed against the Astro 6 build and matches once entities are decoded, including the task-list checkboxes part tracking depends on. `parts.test.ts` now renders with Sätteri, so it tests the processor the site actually uses.
- **Progress now counts everything.** Every phase is scored on its parts plus exit criteria, and Phase 1 also on its drills; the dashboard, phase headers, and header gauge show the breakdown ("12/71 parts · 2/5 criteria"). The progress store gains `parts`, `testedOut`, `plan`, and `edition` fields additively — saves from before this change load with every tick intact. The progress page's totals now come from the docs instead of a hard-coded count.
- Phase docs 1–7: one line of 2026 market evidence each in "Why this phase exists", linked to `the-role.md`. Phase 5 adds the MCP governance update, the "lethal trifecta" security rule, context rot, `AGENTS.md`, real links to Anthropic's context-engineering and tool-writing posts, and turns its project parts A–C into trackable list items. Phase 6 adds judge validation by true-/false-positive rates and the Husain/Shankar evals FAQ. Phase 7 adds an OWASP LLM Top 10 walk-through, cost per successful task, and fine-tuning evidence. Phase 3 links OWASP LLM01; Phase 2 links Karpathy's "Deep Dive into LLMs"; Phase 4 adds the MTEB leaderboard.
- LangGraph links point at the current docs (`docs.langchain.com`); the old URL is now a redirect stub. Claude Agent SDK links point at their current home.
- `AGENTS.md`: documents part tracking (`track: off`, hashed keys, append-only criteria) and how to cut the next edition.
- `pyproject.toml`: pyright now type-checks `phases/` and `scripts/` as well as `projects/`; ruff's `T20` (no `print`) is relaxed under `phases/` and `scripts/` for teaching and build scripts.
- `AGENTS.md`: new "The learning site" section documenting that `site/` is the only place TypeScript belongs, that `phases/` remains the source of truth, and that drill stubs sometimes omit an import deliberately.
- `README.md`: links to the interactive site.
- `phases/01-foundations.md`: Part A now links to its worked-out drills.
- Branch policy: `main` is no longer described as protected. The repository owner commits to it directly; outside contributors still fork and open a pull request. Updated in `BRANCH_NAMING_GUIDELINES.md`, `AGENTS.md`, and `CLAUDE.md`.

### Fixed

- Site unit tests failed on Node 25 and later. Node now ships a global `localStorage` that is `undefined` without `--localstorage-file`, and it shadowed jsdom's, so every `progress.test.ts` case died in `beforeEach`. `vitest.config.ts` passes `--no-experimental-webstorage`, the flag name Node 24 (CI) also accepts.
- The site no longer scrolls sideways on phones. Inline code in lessons and phase docs wraps instead of running off the screen (it was `white-space: nowrap`). The header fits one row from 320px wide, shedding the Dashboard link, progress gauge, and edition badge by breakpoint; between 640px and 767px the site name had been wrapping onto two lines. Measured on every page type at nine widths from 320px to 1280px.
- On phones the logo link had no accessible name: its only text was `aria-hidden` or `display: none`. The site name is now visually hidden there but still read out.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v1.1.0 -->
<!-- v1.0.0 -->
<!-- v1.0.0-beta.1 -->
<!-- v0.0.1 -->

[Unreleased]: https://github.com/dileepadev/learn-ai-engineering/compare/v1.0.0-beta.1...HEAD
[1.0.0-beta.1]: https://github.com/dileepadev/learn-ai-engineering/releases/tag/v1.0.0-beta.1
