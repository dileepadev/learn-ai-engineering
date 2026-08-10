# Changelog

All notable changes to this project are documented in this file.

Changes are organized into the following categories:

- **Added:** New features or functionality introduced to the project.
- **Changed:** Modifications to existing functionality that do not add new features.
- **Fixed:** Bug fixes that resolve issues or correct unintended behavior.
- **Removed:** Features or components that have been removed from the project.

## [Unreleased]

### Added

- Phase 1 Part A learning module under `phases/01-foundations/part-a/` — twelve topics, each with a lesson, a drill file of typed stubs, a pytest specification, and a commented reference solution. Topic 00 covers Python from scratch (variables, numbers, strings, conditionals, loops) for use as a refresher or a first encounter.
- Postgres container, seeded schema, and query drills for the Part A SQL topic (`phases/01-foundations/part-a/sql/`).

### Changed

- `pyproject.toml`: pyright now type-checks `phases/` as well as `projects/`; ruff's `T20` (no `print`) is relaxed under `phases/` for teaching scripts.
- `phases/01-foundations.md`: Part A now links to its worked-out drills.
- Branch policy: `main` is no longer described as protected. The repository owner commits to it directly; outside contributors still fork and open a pull request. Updated in `BRANCH_NAMING_GUIDELINES.md`, `AGENTS.md`, and `CLAUDE.md`.

<!-- e.g., -->
<!-- Unreleased -->
<!-- v2.0.0 -->
<!-- v1.1.0 -->
<!-- v1.0.0 -->
<!-- v0.0.1 -->

[Unreleased]: https://github.com/dileepadev/learn-ai-engineering/branches
