# Phase 1, Part A — Python for AI engineering

Twelve topics, each with a lesson to read and drills to pass. This covers Part A of
[phases/01-foundations.md](../../01-foundations.md) — the Python subset this field actually
uses, and nothing else.

**New to Python? Start at topic 00.** It covers the language itself — variables, numbers,
strings, `if`/`elif`/`else`, `for`, `while` — before topic 01 starts assuming it. If Python is
a refresher rather than a first encounter, read topic 00's **gotcha** callouts and move on.

## How it works

Every topic has four pieces:

| Piece | Where | What it is |
| --- | --- | --- |
| Lesson | `lessons/NN-topic.md` | The teaching: what, why, and the gotcha that bites |
| Drill | `drills/dNN_topic.py` | **Your work.** Typed signatures, docstrings, `NotImplementedError` |
| Test | `tests/test_NN_topic.py` | The specification, and your progress bar |
| Solution | `solutions/sNN_topic.py` | The answer key, commented with the reasoning |

The loop: read the lesson, open the drill, replace each `raise NotImplementedError` with a
real implementation, run the tests until they are green.

```bash
# your progress bar — red until you do the work
uv run pytest phases/01-foundations/part-a

# one topic at a time (recommended)
uv run pytest phases/01-foundations/part-a/tests/test_01_core_mechanics.py

# the annotations are graded separately, and topic 10 depends on it
uv run pyright
```

Two things worth knowing:

- **The drill tests are not part of the repo's main suite.** `uv run pytest` at the repo root
  only collects `projects/`, so a half-finished Part A never makes the workspace look broken.
  You opt in by naming the path.
- **The answer key is executable.** `DRILLS_IMPL=solutions uv run pytest
  phases/01-foundations/part-a` runs the same tests against `solutions/` — that is how the
  answers were verified rather than merely asserted. `conftest.py` is mostly comment — about
  fifteen lines of actual code — and worth reading once you reach topic 06.

## The topics

Work them in order; later ones lean on earlier ones.

| # | Topic | Lesson | Drills |
| --- | --- | --- | --- |
| 00 | Python basics | [lesson](lessons/00-python-basics.md) | 9 |
| 01 | Core mechanics | [lesson](lessons/01-core-mechanics.md) | 7 |
| 02 | Functions, properly | [lesson](lessons/02-functions.md) | 6 |
| 03 | Comprehensions & iteration | [lesson](lessons/03-comprehensions.md) | 6 |
| 04 | Errors | [lesson](lessons/04-errors.md) | 6 |
| 05 | Files & data | [lesson](lessons/05-files-and-json.md) | 6 |
| 06 | Modules & structure | [lesson](lessons/06-modules-and-structure.md) | 5 |
| 07 | Just enough OOP | [lesson](lessons/07-oop-just-enough.md) | 6 |
| 08 | Generators & iterators | [lesson](lessons/08-generators.md) | 7 |
| 09 | Decorators & context managers | [lesson](lessons/09-decorators-and-context-managers.md) | 6 |
| 10 | Type hints | [lesson](lessons/10-type-hints.md) | 8 |
| 11 | A little SQL | [lesson](lessons/11-a-little-sql.md) | 12 |

Topic 11 works differently — see below.

## Topic 11 is not graded by pytest

SQL needs a database, and requiring a running container for the test suite to pass is a poor
trade for "a little SQL." So topic 11 ships a Postgres container, a seeded schema, and
questions with their expected results stated inline. You check your own answers.

```bash
cd phases/01-foundations/part-a
docker compose -f sql/docker-compose.yml up -d
docker compose -f sql/docker-compose.yml exec db psql -U learner -d learning
```

Then work through `sql/drills.sql`, with `sql/solutions.sql` as the answer key. Postgres runs
on host port **5433** so it cannot collide with anything you already have. `down -v` wipes and
re-seeds.

## Progress

- [ ] 00 — Python basics
- [ ] 01 — Core mechanics
- [ ] 02 — Functions, properly
- [ ] 03 — Comprehensions & iteration
- [ ] 04 — Errors
- [ ] 05 — Files & data
- [ ] 06 — Modules & structure
- [ ] 07 — Just enough OOP
- [ ] 08 — Generators & iterators
- [ ] 09 — Decorators & context managers
- [ ] 10 — Type hints
- [ ] 11 — A little SQL

When all twelve are ticked, you have Part A. Part B (uv, Pydantic, asyncio, FastAPI, SSE,
Docker) and the `wrangle` and `mockstream` projects come next — see
[phases/01-foundations.md](../../01-foundations.md).

## A note on the answer key

Peeking early is a learning bug, not a moral failing — but it does mean coming back. The
solutions are commented with *why* each choice was made rather than what the code does, so
they are worth reading properly even after you have passed a topic.
