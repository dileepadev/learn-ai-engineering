# AGENTS.md

Canonical instructions for AI coding agents working in this repository.

> This file is the **single source of truth**. `CLAUDE.md`, `.github/copilot-instructions.md`,
> and `.cursor/rules/` intentionally contain only tool-specific notes and point back here.
> Add shared rules **here only** — duplicating them causes drift and contradictory guidance.

## What this repository is

A **learning monorepo** for modern AI engineering: LLM applications, agents, RAG, structured
outputs, evals, and production deployment. It holds two kinds of content:

1. **Roadmap documentation** (`README.md`, `phases/*.md`) — an 8-phase curriculum.
2. **Phase projects** (`projects/*`) — the Python applications built while working the phases.

The owner is an Associate AI Engineer rebuilding skills with current tools. **The purpose of
this repo is learning, not shipping a product.** That single fact drives the rules below.

### What this repo is NOT

- Not a machine learning or data science curriculum. No training-from-scratch, no calculus,
  no notebooks-as-a-lifestyle, no sklearn/NumPy/pandas work. Do not suggest them.
- Not a library others depend on. There is no public API to keep stable.

## Teaching mode (the rule that makes this repo different)

**Write the code. Then make sure the user understands it.** Do not withhold implementations,
and do not refuse a task to make the user do it themselves.

Every non-trivial change must be accompanied by an explanation covering:

- **What** the code does, walked through at the level of the key moving parts.
- **Why** it is built this way — the tradeoff, the alternative you rejected, and why.
- **Where** it fits: which phase concept it demonstrates and what it connects to later.
- **Gotchas** — the failure mode a newcomer would hit, and how the code guards against it.

Concretely:

- Prefer the **clear** implementation over the clever one. If a dense one-liner and a readable
  ten-liner do the same job, write the ten-liner. This code is read to learn from.
- Comment the **non-obvious**: why a semaphore bound is 20, why a retry is capped, why a field
  is `Literal` rather than `str`. Do not comment what the code plainly says.
- When several valid approaches exist, name them and say which you chose and why — briefly.
- If the user's request would produce something subtly wrong (a common AI-engineering
  footgun), say so and explain the correct approach rather than silently complying.

## Repository layout

```text
learn-ai-engineering/
├── AGENTS.md                     <- canonical agent instructions (this file)
├── CLAUDE.md                     <- pointer + Claude Code specifics
├── README.md                     <- roadmap overview, stack table, progress
├── pyproject.toml                <- uv workspace root; shared ruff/pyright/pytest config
├── .mcp.json                     <- project-scoped MCP servers
├── phases/                       <- curriculum docs, 01..08
│   └── 01-foundations.md
├── projects/                     <- phase projects (uv workspace members)
│   └── <NN>-<name>/
│       ├── pyproject.toml
│       ├── README.md
│       ├── src/<package>/
│       └── tests/
└── <community standards>         <- CONTRIBUTING, SECURITY, etc. (see Git workflow)
```

### Project naming

Phase projects are `projects/<NN>-<name>/` where `NN` is the zero-padded phase number and
`name` is the project name from that phase's doc — e.g. `projects/01-wrangle/`,
`projects/01-mockstream/`. The Python package inside is `src/<name_with_underscores>/`.

Do not invent project names. They come from the phase docs. If a phase doc does not exist
yet, ask rather than guessing at its contents.

## Toolchain (non-negotiable)

| Concern | Tool | Notes |
| --- | --- | --- |
| Packages, venvs, Python versions | **uv** | Never `pip`, `venv`, `poetry`, `pyenv`, or `conda` |
| Lint + format | **ruff** | Config lives in the root `pyproject.toml` |
| Type checking | **pyright** | Strict mode; config in root `pyproject.toml` |
| Tests | **pytest** | Config in root `pyproject.toml` |
| Validation / schemas | **Pydantic v2** | v1 syntax is an error — see below |
| Web framework | **FastAPI** | Pydantic-native, streaming-friendly |
| HTTP client | **httpx** | Async; never `requests` |
| Containers | **Docker** | Compose for local infra |

Common commands:

```bash
uv sync                                  # install/refresh the workspace environment
uv run --package <name> <entrypoint>     # run a project's CLI
uv run pytest                            # whole workspace
uv run pytest projects/01-wrangle        # one project
uv run ruff check --fix . && uv run ruff format .
uv run pyright
```

Add dependencies with `uv add <pkg> --package <project>` — never hand-edit dependency lists.

## Coding standards

### Typing

- **Every function signature is fully typed**, including return types. This is schema-heavy
  work; types are the contract.
- pyright runs in **strict** mode. Do not silence it with `Any` or blanket `# type: ignore`.
  A narrowly scoped ignore with a comment explaining why is acceptable; a broad one is not.
- Prefer `Protocol` (structural typing) over inheritance hierarchies.
- Use `Literal` for closed sets of string values, `TypedDict` for untyped-JSON boundaries you
  do not own, and Pydantic models for anything you validate.

### Pydantic v2 only

v1 idioms are wrong here and are a frequent AI-generated error. Use:

| Do not use (v1) | Use (v2) |
| --- | --- |
| `@validator` | `@field_validator` |
| `@root_validator` | `@model_validator` |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `.parse_obj()` | `.model_validate()` |
| `class Config:` | `model_config = ConfigDict(...)` |
| `.schema()` | `.model_json_schema()` |

### Async

- LLM work is I/O-bound. Use `async`/`await` throughout; never block the event loop.
- Fan-out uses `asyncio.gather` **with a bounding `asyncio.Semaphore`**. Unbounded fan-out
  against a provider API earns rate limits — always bound it and say what the bound is.
- No `threading` or `multiprocessing`. asyncio is this repo's concurrency model.

### Style

- `src/` layout for every project. Absolute imports.
- `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE` constants,
  `kebab-case` CLI flags and filenames.
- Line length 100 (enforced by ruff).
- Raise specific exceptions, never bare `except:`. API-calling code is mostly error handling.
- No mutable default arguments.
- Use `pathlib`, not `os.path`.

## Testing expectations

- Every project has `tests/` and must pass `uv run pytest` before a commit is proposed.
- Test the **edge cases that actually break**: malformed JSON, missing fields, empty inputs,
  rate-limit responses, stream interruptions. Happy-path-only tests are not sufficient here.
- **Never call a real provider API in a test.** Mock the client or use the phase-1
  `mockstream` service as a test double. Tests must run offline, free, and deterministically.
- Async tests use `pytest-asyncio`. Streaming endpoints get an explicit streaming test.
- When you fix a bug, add the regression test that would have caught it.
- From Phase 6 on, **evals are separate from tests**: tests assert correctness and must be
  deterministic; evals score quality and may be non-deterministic. Never mix them in one run.

## Documentation requirements

- Each project has a `README.md` covering: what it is, what it teaches, how to run it, how to
  test it. Keep it short and current.
- Docstrings on public functions/classes — purpose, args, returns, raises. Skip them on
  obvious private helpers.
- **Phase docs** (`phases/*.md`) follow the structure established in
  [phases/01-foundations.md](phases/01-foundations.md): goal / you build / effort, why the
  phase exists, content parts, project(s), resources, exit criteria as a checklist. Match its
  voice — direct, opinionated, second person, no filler.
- When a project is completed, tick its box in the README **Progress** list and link it under
  **Project code**.
- Update `CHANGELOG.md` for notable changes, following the categories it defines
  (Added / Changed / Fixed / Removed).

## Git workflow

This repo has its own community standards. **Follow them; do not invent conventions.**

| Topic | Authority |
| --- | --- |
| Commit messages | [COMMIT_MESSAGE_GUIDELINES.md](COMMIT_MESSAGE_GUIDELINES.md) |
| Branch names | [BRANCH_NAMING_GUIDELINES.md](BRANCH_NAMING_GUIDELINES.md) |
| Pull requests | [PULL_REQUEST_GUIDELINES.md](PULL_REQUEST_GUIDELINES.md) |
| Versioning / releases | [VERSIONING.md](VERSIONING.md) |
| Contributing flow | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security reporting | [SECURITY.md](SECURITY.md) |

Read the relevant file before acting rather than assuming Conventional Commits defaults —
this repo's format is similar but not identical.

Quick reference (the authority above still wins):

- Commit: `<type>(<scope>): <Short message>` — imperative mood, capitalized, no trailing period.
- Useful scopes here: `repo`, `docs`, `phases`, and the project name (e.g. `wrangle`).
- Branch: `feat/x`, `fix/x`, `docs/x`, `chore/x`, … — for outside contributors, and for the
  owner when a change is big enough to want reviewing in one piece.
- **The owner commits directly to `main`.** This is a solo learning repo; do not create a
  branch, and do not offer to, unless asked. The fork-and-PR flow in
  [CONTRIBUTING.md](CONTRIBUTING.md) is for external contributors.
- **Never commit or push unless the user asks.** Unchanged, and unrelated to the above — it is
  about not acting unprompted, not about which branch you are on.

## Secrets and cost

This project spends real money on real API keys. Treat both carefully.

- API keys live in environment variables loaded from `.env`. **`.env` is gitignored and must
  stay that way.** Never write a key into code, config, a test fixture, or a commit.
- Commit `.env.example` with the variable *names* and no values.
- Never print or log a full key. Never paste a key into a URL or a shell command that lands in
  history.
- Default to the cheapest model that fits the task for drills and tests. Use prompt caching and
  batching where they apply. Flag anything likely to be expensive **before** running it.
- Prefer local Ollama models for exercises where the specific model does not matter.

## Anti-hallucination constraints

These are the failure modes that matter most in this repo.

**Current Claude model IDs** (do not use older `claude-3-*` strings — they are wrong here):

| Model | ID |
| --- | --- |
| Fable 5 | `claude-fable-5` |
| Opus 5 | `claude-opus-5` |
| Sonnet 5 | `claude-sonnet-5` |
| Haiku 4.5 | `claude-haiku-4-5-20251001` |

Default to the latest, most capable models when building AI applications here.

Further rules:

- **Do not invent APIs.** The libraries in this stack (uv, Pydantic v2, FastAPI, LangGraph,
  Instructor, pgvector) move fast. If unsure of a signature, look it up — the Context7 MCP
  server is configured for exactly this. Verify before asserting.
- **Do not invent links, file paths, or phase content.** Only 1 of 8 phase docs exists at the
  time of writing. Check what is actually on disk before referencing it.
- **Do not fabricate command output, test results, or benchmarks.** Run the command, or say
  you did not.
- **Do not add dependencies outside the stack table in the README** without flagging it and
  saying what it replaces. Stack discipline is a stated project principle: one primary tool per
  category.
- If a request is ambiguous or the repo contradicts it, ask. A wrong assumption compounds
  across a monorepo.

## MCP servers

Configured in `.mcp.json`, deliberately minimal:

- **Context7** — up-to-date library documentation. The highest-value server here: it prevents
  hallucinated APIs for fast-moving libraries. Use it before writing against an unfamiliar
  library surface.
- **Microsoft Learn** *(connected via the Claude client, not `.mcp.json`)* — official Azure
  docs. Relevant because Phase 7 is Azure-first: Microsoft Foundry, Azure AI Search, Azure
  Container Apps.

Deliberately **not** configured, to avoid bloat: filesystem, fetch, and git servers (built-in
tools already cover these), GitHub (the `gh` CLI is available), and Playwright (this roadmap
builds CLIs and APIs, not browser UIs).

**Add at Phase 4**, when a database actually exists: a Postgres MCP server, for inspecting
pgvector schemas and query plans during RAG work. It provides no value before then.
