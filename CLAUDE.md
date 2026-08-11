# CLAUDE.md

## Read AGENTS.md first

**[AGENTS.md](AGENTS.md) holds all project rules** — teaching mode, repo layout, toolchain,
coding standards, testing, docs, git workflow, secrets, and anti-hallucination constraints.
Read it before doing anything in this repo. This file adds only Claude Code specifics.

When a rule needs to change, edit `AGENTS.md`, not this file.

## The one-line summary

A **learning monorepo** for AI engineering: roadmap docs in `phases/`, Python projects in
`projects/`. Write the code *and* teach it — every non-trivial change comes with an
explanation of what it does, why it is built that way, and what would go wrong otherwise.

## Claude Code specifics

### Skills

- **`claude-api`** — load this **before** writing any code against the Anthropic API or
  reasoning about Claude models, pricing, tokens, streaming, tool use, or caching. Do not
  answer from memory; model IDs and pricing change. This applies across Phases 2–8, which are
  built largely on the Anthropic API.
- **`security-review`** — worth running before deploying anything in Phase 7.

### Working style in this repo

- Use **plan mode** for anything spanning multiple files or introducing a new project under
  `projects/`. Monorepo mistakes are expensive to unwind.
- Prefer the **Read/Edit/Grep/Glob** tools over shell equivalents (`cat`, `sed`, `find`).
- Reference files as clickable links — `[01-foundations.md](phases/01-foundations.md)` — since
  the user works in VS Code.
- Independent tool calls go in a single block, in parallel.

### Verification before proposing a commit

```bash
uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest
```

If the change touched `phases/` or `site/`, also run, from `site/`:

```bash
npm run check && npm run test
npm run verify:drills   # all 207 Part A tests, executed in Pyodide
```

Report real results. If something fails, say so and show the output — never claim a passing
run you did not perform.

### Git

Follow [COMMIT_MESSAGE_GUIDELINES.md](COMMIT_MESSAGE_GUIDELINES.md) and
[BRANCH_NAMING_GUIDELINES.md](BRANCH_NAMING_GUIDELINES.md) — this repo's format is close to
Conventional Commits but not identical, so read it rather than assuming.

The owner works directly on `main` — do not create a branch unless asked for one.

**Never commit or push unless explicitly asked.** That still holds; it is about not acting
unprompted, not about which branch you are on.
