# TODO

This file tracks tasks, improvements, and features planned for upcoming updates or releases of this repository.

>[!Note]
> This list is **not exhaustive** and may change over time. Items are not necessarily in priority order.

## Done

- [x] Repo scaffolding: `AGENTS.md`, `CLAUDE.md`, community-standard docs (`CONTRIBUTING.md`,
      `CODE_OF_CONDUCT.md`, `SECURITY.md`, commit/branch/PR guidelines, `VERSIONING.md`)
- [x] `pyproject.toml` uv workspace root — shared ruff/pyright/pytest config for `projects/*`
- [x] All 8 phase roadmap docs (`phases/01-foundations.md` through `phases/08-capstone.md`)
- [x] Phase 1 Part A learning module (`phases/01-foundations/part-a/`) — 12 topics, each with a
      lesson, typed drill stubs, a pytest spec, and a reference solution
- [x] Phase 1 Part A SQL topic — Postgres compose file, schema, seed data, drills
- [x] Interactive learning site (`site/`, Astro) — phase pages, dashboard, in-browser drill
      runner via Pyodide, comprehension checks, `localStorage` progress with export/import
- [x] `scripts/export_curriculum.py` — exports `phases/` content into the site's generated data
- [x] Site verification tooling — `verify:drills` (Pyodide), `verify:pages` (a11y/console),
      `verify:browser` (Firefox e2e)
- [x] CI: `.github/workflows/deploy-site.yml` — type-check, test, build, verify drills, deploy
      to GitHub Pages

## Upcoming Tasks

### Phase 1 — Foundations

- [ ] Work through Part A drills end-to-end (all 12 topics + SQL) until
      `uv run pytest phases/01-foundations/part-a` and `npm run verify:drills` are green from
      your own solutions, not just the reference ones
- [ ] Part B setup: confirm Pydantic v2, asyncio, FastAPI, SSE, and Docker fluency (no dedicated
      lesson content planned for Part B — it's demonstrated through the two projects below)
- [ ] `projects/01-wrangle` — warm-up CLI: parse messy JSON → validate with Pydantic →
      normalize/dedupe → typed clean output + terminal summary report
- [ ] `projects/01-mockstream` — FastAPI service that mimics a streaming LLM API (SSE,
      `httpx` async client, bounded concurrency, Dockerized); stretch: simulate 429s + backoff
- [ ] Tick Phase 1's exit criteria checklist in `phases/01-foundations.md`
- [ ] Mark Phase 1 complete in the README **Progress** list once both projects land

### Phase 2 — LLMs & Model APIs

- [ ] Build out `phases/02-llms-and-model-apis/` lesson content (if Part A/B split applies)
- [ ] Start `projects/02-*` (see `phases/02-llms-and-model-apis.md` for the project name — do
      not invent one)

### Phases 3–8

- [ ] Not started. Roadmap docs exist; no lesson content or projects built yet.

## Repo maintenance

- [ ] Keep `CHANGELOG.md` updated as each phase's content/projects land
- [ ] Keep README **Progress** checklist and **Project code** links in sync with `projects/`

<!-- Example Task List Format

- [x] Task 1: Description of task 1.
- [ ] Task 2: Description of task 2. -->
