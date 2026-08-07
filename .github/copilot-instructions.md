# GitHub Copilot Instructions

## Read AGENTS.md first

**[AGENTS.md](../AGENTS.md) is the single source of truth** for this repository — teaching
mode, layout, toolchain, coding standards, testing, docs, git workflow, and
anti-hallucination constraints. This file is a condensed pointer, not a substitute.

Shared rules change in `AGENTS.md`, never here.

## Project context

A **learning monorepo** for modern AI engineering (LLM apps, agents, RAG, evals, deployment).
Roadmap docs live in `phases/`; Python projects live in `projects/<NN>-<name>/` as uv
workspace members. The goal is learning, so **generated code is explained, not just delivered**
— favour the clear implementation over the clever one, and comment the non-obvious.

This is **not** a data science repo: no NumPy, pandas, sklearn, notebooks, or model training.

## Hard rules for generated code

- **uv** for packages — never `pip`, `venv`, `poetry`, or `conda`.
- **Pydantic v2 only** — `@field_validator`, `model_dump()`, `model_validate()`,
  `model_config = ConfigDict(...)`. v1 idioms (`@validator`, `.dict()`, `class Config:`) are
  wrong here.
- **Fully typed signatures**, including return types. pyright runs strict; do not paper over
  it with `Any` or blanket `# type: ignore`.
- **async everywhere** for I/O; `httpx`, never `requests`. Bound every fan-out with an
  `asyncio.Semaphore` — unbounded concurrency against a provider API earns rate limits.
- **`src/` layout**, absolute imports, `pathlib` over `os.path`, line length 100.
- Specific exceptions only — never bare `except:`.
- **Never hardcode API keys.** They come from environment variables via a gitignored `.env`.
- **Never call a real provider API in a test** — mock it, or use the `mockstream` test double.

## Current Claude model IDs

Older `claude-3-*` identifiers are wrong in this repo:

| Model | ID |
| --- | --- |
| Fable 5 | `claude-fable-5` |
| Opus 5 | `claude-opus-5` |
| Sonnet 5 | `claude-sonnet-5` |
| Haiku 4.5 | `claude-haiku-4-5-20251001` |

## Commits

Follow [COMMIT_MESSAGE_GUIDELINES.md](../COMMIT_MESSAGE_GUIDELINES.md) —
`<type>(<scope>): <Short message>`, imperative mood, capitalized, no trailing period. Close to
Conventional Commits but not identical, so check the file rather than assuming.
