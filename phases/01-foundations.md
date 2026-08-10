# Phase 1 — Foundations: Python for AI Engineering

- **Goal:** Learn Python from the ground up — scoped ruthlessly to what AI engineering actually uses — plus the engineering substrate every later phase leans on: typing, async, streaming, a little SQL, and containers.  
- **You build:** `wrangle`, a typed data-cleaning CLI (warm-up), then `mockstream`, a streaming "fake LLM" web service — typed, tested, Dockerized.  
- **Effort:** ~30–50 hours if Python is new territory; a fraction of that as a refresher. Either way, don't skip the projects.

## Why this phase exists

AI engineering is 80% ordinary software engineering under unusual constraints: everything is async and streamed, everything is untyped JSON until you force types onto it, and everything talks to slow, expensive, flaky external APIs. This phase teaches exactly the Python that serves those constraints — and skips the rest of the language's folklore. The filter for every topic below: *will a later phase use this?* If not, it's out.

## Part A — Python, from the start (the AI engineering subset)

Work through these in order, writing small scripts at every step. Type-hint everything from day one — in this field, schemas are the job.

> [!TIP]
> **[Part A is built out in `01-foundations/part-a/`](01-foundations/part-a/README.md)** — a lesson and a set of failing tests for each bullet below. Read the lesson, fill in the drills, run `uv run pytest phases/01-foundations/part-a` until it's green.

- **Core mechanics:** variables, numbers, strings and f-strings, truthiness; `list`, `dict`, `set`, `tuple` and when each fits; slicing; control flow. Dicts get special attention — every API payload you'll ever touch is one.
- **Functions, properly:** positional vs keyword args, defaults (and the mutable-default trap), `*args`/`**kwargs`, functions as values, closures. Provider SDKs and frameworks assume fluency here.
- **Comprehensions & iteration:** list/dict comprehensions, `enumerate`, `zip`, sorting with `key=`.
- **Errors:** `try/except/finally`, raising your own exceptions, exception chaining. API-calling code is mostly error handling; get comfortable early.
- **Files & data:** `pathlib`, reading/writing text, and `json` deeply — JSON is the substrate of everything LLM. `csv` in passing.
- **Modules & structure:** imports, packages, the `src/` layout, entry points.
- **Just enough OOP:** classes, `@dataclass`, methods, properties, minimal inheritance; prefer `Protocol` (structural typing) over class hierarchies. You'll *use* many classes and *write* few.
- **Generators & iterators:** `yield`, generator functions, lazy iteration. This is literally how token streaming works — Part B depends on it.
- **Decorators & context managers:** at read-and-use level (`@app.get(...)`, `with open(...)`, `@pytest.fixture`) — FastAPI and pytest are built from them. Write one trivial decorator and one context manager to demystify the syntax, then move on.
- **Type hints:** every signature typed; `Optional`/unions, `Literal`, `TypedDict`, generics as they come up.
- **A little SQL:** `SELECT`, `JOIN`, `GROUP BY`, indexes at a practical level. From Phase 4 onward your app data, vectors, and full-text search all live in PostgreSQL.

**Explicitly skipped:** metaclasses, multiple-inheritance puzzles, threading/multiprocessing internals (asyncio covers this roadmap's concurrency), NumPy/pandas, notebooks-as-a-lifestyle, classical ML (sklearn), statistics. If a tutorial starts with a gradient, close the tab.

## Part B — the engineering substrate

- **Modern Python tooling:** [uv](https://docs.astral.sh/uv/) for packages/environments/Python versions (it has effectively replaced pip + venv + pyenv + poetry), [ruff](https://docs.astral.sh/ruff/) for linting + formatting, `pyright` for type checking, `pytest` for tests. Set these up once as your default project template.
- **Pydantic v2:** models, validators, `model_json_schema()`, serialization. This is *the* load-bearing library of Python AI engineering — it defines your API contracts, your LLM output schemas, and your tool signatures.
- **asyncio:** `async`/`await`, `gather`, semaphores for concurrency limits, async generators. LLM apps are I/O-bound; concurrency is how you make 100 extraction calls take 30 seconds instead of 30 minutes.
- **FastAPI:** routes, dependency injection, Pydantic request/response models, background tasks, `StreamingResponse`.
- **Streaming over HTTP:** what Server-Sent Events (SSE) are and how to produce/consume them. Every chat UI you'll ever build streams tokens this way.
- **Docker:** write a Dockerfile for a Python service, multi-stage builds, compose for app + database. Competence, not expertise.
- **Git hygiene:** branches, meaningful commits, PR-shaped changes — your later projects are portfolio pieces.

## Warm-up project: `wrangle`

A CLI that turns messy JSON into clean, typed data — pure Part A muscle, zero web code.

1. Feed it a real messy export: browser bookmarks, a social/streaming data export, or any public JSON dataset.
2. Parse → validate into Pydantic models → normalize (dates, URLs) and dedupe → emit clean JSON plus a terminal summary report (counts, top categories, rejects with reasons).
3. Typed end-to-end, `pytest` coverage for the ugly edge cases, `ruff` clean, proper `src/` layout, installable entry point (`uv run wrangle ...`).

If Python is fresh, expect this to take a few evenings. That's the point — it exercises every Part A topic in one artifact.

## Main project: `mockstream`

A FastAPI service that *pretends* to be an LLM API — so you learn the transport layer with zero API cost, and get a reusable test double for later phases.

1. `POST /v1/chat` accepts `{messages: [...], stream: bool}` validated by Pydantic; rejects malformed input with useful errors.
2. Non-streaming mode returns a canned completion after an artificial delay.
3. Streaming mode returns SSE, emitting word-by-word chunks with realistic pacing, terminated by a `[DONE]` event (mirror the shape of a real provider's streaming format).
4. A `httpx`-based async client script consumes the stream and prints tokens as they arrive; run 20 concurrent requests bounded by a semaphore.
5. Typed end-to-end (`pyright` clean), tested (`pytest` + `httpx` test client, including a streaming test), linted (`ruff`), Dockerized (compose file runs it).

**Stretch:** add a failure mode (random 429s with `Retry-After`) and make your client handle it with exponential backoff — you'll reuse this exact logic against real providers in Phase 2.

## Resources

- [The official Python tutorial](https://docs.python.org/3/tutorial/) — chapters 1–9 map almost exactly onto Part A; read actively, typing every example
- [Exercism Python track](https://exercism.org/tracks/python) — free drills; do a handful per Part A topic until it's automatic
- [Real Python](https://realpython.com) — topical deep-dives for when a concept (decorators, generators, asyncio) won't click
- [SQLBolt](https://sqlbolt.com) — interactive SQL basics in an afternoon
- [uv docs](https://docs.astral.sh/uv/) — read "Working on projects" end to end; it's short
- [Pydantic docs](https://docs.pydantic.dev) — Models, Validators, JSON Schema pages
- [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) — through "Bigger Applications"; skim the rest
- [asyncio — Python docs](https://docs.python.org/3/library/asyncio.html) plus any good "asyncio for web APIs" walkthrough
- [MDN on Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — short and definitive

## Exit criteria

- [ ] I can write a typed Python CLI — args, files, JSON, exceptions, tests — without reaching for a reference on every line
- [ ] I can read generator-, decorator-, and context-manager-based code (any FastAPI example) and explain what it's doing
- [ ] I can start a new Python project (uv + ruff + pyright + pytest, src layout) from scratch in under 10 minutes
- [ ] I can explain when to reach for Pydantic vs a dataclass, and write a custom validator without looking it up
- [ ] I can write an async function that fans out N API calls with bounded concurrency and collects results
- [ ] I can write basic SQL (SELECT with JOINs and aggregates) against a Postgres database
- [ ] `wrangle` and `mockstream` are complete: streaming works from a browser and from my async client, tests pass, `docker compose up` works
- [ ] I can explain how SSE differs from WebSockets and why chat UIs use SSE
