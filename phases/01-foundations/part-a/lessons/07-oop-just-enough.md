# 07 — Just enough OOP

> **Drill:** `drills/d07_oop.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_07_oop.py`

The phase doc's framing is exact: "You'll *use* many classes and *write* few." You will use
Pydantic models, FastAPI apps, and provider clients constantly. You will define your own class
hierarchy roughly never. This topic covers the small amount you need and skips the rest.

## Classes, minimally

```python
class RateLimiter:
    """Tracks how many requests remain in the current window."""

    def __init__(self, limit: int) -> None:
        self.limit = limit  # instance attribute
        self.used = 0

    def consume(self) -> bool:
        """Take one request slot. Returns False if none are left."""
        if self.used >= self.limit:
            return False
        self.used += 1
        return True
```

`__init__` runs at construction. `self` is the instance, passed automatically — you never pass
it at the call site, only declare it. Type it as `-> None`; `__init__` returns nothing.

## `@dataclass` — for holding data

Most classes you write are records: some fields, no behaviour. Writing `__init__`, `__repr__`,
and `__eq__` for those by hand is pure ceremony. `@dataclass` writes them:

```python
from dataclasses import dataclass, field


@dataclass
class Bookmark:
    url: str
    title: str
    tags: list[str] = field(default_factory=list[str])  # NOT `= []`
```

You get `__init__`, a readable `__repr__`, and `__eq__` that compares field by field — so
`Bookmark("a", "b") == Bookmark("a", "b")` is `True`, which is what tests want.

**`field(default_factory=...)` is topic 02's mutable-default trap in a new costume.** A bare
`tags: list[str] = []` would share one list across every instance. Dataclasses detect that
specific case and refuse at class-definition time, which is unusually kind of them; the
`default_factory` builds a fresh list for each instance.

Write the factory as `list[str]`, not bare `list`. Both do the same thing at runtime —
`list[str]()` returns `[]` — but a bare `list` leaves pyright inferring `list[Unknown]`, which
fails this repo's strict setting. You will see the same pattern for `dict[str, int]` fields.

`@dataclass(frozen=True)` makes instances immutable and hashable — usable as dict keys and set
members. Reach for it whenever nothing needs to mutate, which is more often than you would
guess.

### dataclass vs Pydantic

This is an exit-criterion question for Phase 1, so be clear on it:

| | `@dataclass` | Pydantic `BaseModel` |
| --- | --- | --- |
| Validates at runtime | **no** | **yes** |
| Coerces types | no | yes (`"5"` → `5`) |
| JSON schema | no | `.model_json_schema()` |
| Cost | zero | some |

A dataclass's type hints are **documentation only**. `Bookmark(url=42, title=None)` constructs
fine and fails much later, somewhere else.

The rule: **data crossing a trust boundary gets Pydantic; data already inside your program gets
a dataclass.** API responses, user input, config files, and LLM output are all untrusted —
Pydantic. An intermediate value you built yourself three lines ago — dataclass. Part B
introduces Pydantic properly; this is the distinction it builds on.

## `@property` — a method that reads like an attribute

```python
@dataclass
class Usage:
    input_tokens: int
    output_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


usage.total_tokens  # no parentheses — computed on access
```

Use it for cheap values derived from other fields. The win is that callers do not have to know
whether something is stored or computed, so you can change your mind later without breaking
them. Do not put slow work or side effects behind a property; `usage.total_tokens` looks free
and should be.

## `Protocol` — structural typing, and why AGENTS.md prefers it

Classic OOP says: to be usable as a `Tokenizer`, inherit from `Tokenizer`. That is **nominal**
typing — the name is the contract, and it forces every implementer to import your base class.

`Protocol` inverts it. You describe the shape; anything with that shape qualifies:

```python
from typing import Protocol


class Tokenizer(Protocol):
    def count(self, text: str) -> int: ...


class WordTokenizer:  # note: inherits from nothing
    def count(self, text: str) -> int:
        return len(text.split())


def estimate_cost(text: str, tokenizer: Tokenizer) -> float:
    return tokenizer.count(text) * 0.000003


estimate_cost("hello world", WordTokenizer())  # pyright accepts this
```

`WordTokenizer` never mentions `Tokenizer`, and pyright still verifies the match statically.
The `...` in the protocol body is the whole method body — there is nothing to implement.

Why this matters here specifically: you do not own the classes you need to accept. The
Anthropic client, the OpenAI client, and your Phase 1 `mockstream` test double cannot all
inherit from a base class you invented. But they can all *have the same shape*, and a Protocol
lets you type against that shape and swap them freely. That is the entire testing strategy for
phases 2 onward, and it is why AGENTS.md says "prefer `Protocol` over inheritance hierarchies."

## What to skip

Metaclasses, multiple inheritance, `__slots__`, abstract base classes, descriptors,
`super()` diamond resolution. The phase doc lists these as explicitly out of scope. If you
meet one in a library, read its docs then; you will not write one.

## Where this shows up later

- **Phase 2** — a Protocol for "an LLM client", satisfied by both the real client and a fake.
- **Phase 3** — Pydantic models as extraction schemas (the dataclass distinction pays off).
- **Phase 5** — a tool Protocol: name, description, and a callable.

## Do the drills

`drills/d07_oop.py`. Six exercises, ending with a Protocol you implement twice — once "for
real" and once as a test double, which is the pattern in miniature.
