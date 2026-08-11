# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

### Added

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

- `pyproject.toml`: pyright now type-checks `phases/` and `scripts/` as well as `projects/`; ruff's `T20` (no `print`) is relaxed under `phases/` and `scripts/` for teaching and build scripts.
- `AGENTS.md`: new "The learning site" section documenting that `site/` is the only place TypeScript belongs, that `phases/` remains the source of truth, and that drill stubs sometimes omit an import deliberately.
- `README.md`: links to the interactive site.
- `phases/01-foundations.md`: Part A now links to its worked-out drills.
- Branch policy: `main` is no longer described as protected. The repository owner commits to it directly; outside contributors still fork and open a pull request. Updated in `BRANCH_NAMING_GUIDELINES.md`, `AGENTS.md`, and `CLAUDE.md`.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v2.0.0 -->
<!-- v1.1.0 -->
<!-- v1.0.0 -->
<!-- v0.0.1 -->

[Unreleased]: https://github.com/dileepadev/learn-ai-engineering/branches
