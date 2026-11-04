# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

This is the **2026 edition** — built to be finished by 31 December 2026. Suggested release: tag `v1.0.0` once merged; the 2027 edition will be `v2.0.0` (see "Editions" in `AGENTS.md`).

### Added

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

- The site no longer scrolls sideways on phones. Inline code in lessons and phase docs wraps instead of running off the screen (it was `white-space: nowrap`). The header fits one row from 320px wide, shedding the Dashboard link, progress gauge, and edition badge by breakpoint; between 640px and 767px the site name had been wrapping onto two lines. Measured on every page type at nine widths from 320px to 1280px.
- On phones the logo link had no accessible name: its only text was `aria-hidden` or `display: none`. The site name is now visually hidden there but still read out.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v2.0.0 -->
<!-- v1.1.0 -->
<!-- v1.0.0 -->
<!-- v0.0.1 -->

[Unreleased]: https://github.com/dileepadev/learn-ai-engineering/branches
