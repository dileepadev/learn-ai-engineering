# 09 — Decorators & context managers

> **Drill:** `drills/d09_decorators.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_09_decorators.py`

The phase doc scopes this precisely: "at read-and-use level … Write one trivial decorator and
one context manager to demystify the syntax, then move on." That is the goal. You are not
becoming a metaprogramming expert; you are removing the last bit of FastAPI and pytest syntax
that looks like magic.

## Decorators

A decorator is a function that takes a function and returns a replacement. The `@` syntax is
pure shorthand:

```python
@timed
def call_model(prompt: str) -> str: ...


# is exactly:
def call_model(prompt: str) -> str: ...


call_model = timed(call_model)
```

That is the whole idea. Everything else is detail.

Here is one, complete:

```python
import functools
from collections.abc import Callable


def timed(fn: Callable[..., str]) -> Callable[..., str]:
    @functools.wraps(fn)
    def wrapper(*args: object, **kwargs: object) -> str:
        start = time.perf_counter()
        result = fn(*args, **kwargs)  # the original call
        print(f"{fn.__name__} took {time.perf_counter() - start:.2f}s")
        return result

    return wrapper
```

Read the pieces:

- The outer function receives the decorated function as `fn`.
- `wrapper` takes `*args, **kwargs` so it works regardless of the wrapped signature — topic 02.
- It calls `fn(*args, **kwargs)`, unpacking them back out.
- It **returns** `wrapper`, which replaces the original name.

### `functools.wraps` is not optional

Without it, the decorated function's `__name__` becomes `"wrapper"`, its docstring vanishes,
and `help()` shows nothing useful. That breaks pytest (which finds tests by name), FastAPI
(which builds OpenAPI docs from signatures), and every traceback you will read.

`@functools.wraps(fn)` copies the metadata across. Always use it. Drill 9.1 has a test that
fails without it.

### Decorators you will read

```python
@app.get("/health")                # FastAPI: registers the route
@pytest.fixture                    # pytest: marks a fixture provider
@dataclass                         # generates __init__/__repr__/__eq__
@property                          # topic 07
@functools.lru_cache               # memoises results
```

`@app.get("/health")` has parentheses because it is a decorator *factory* — `app.get("/health")`
runs first and **returns** the actual decorator. That is the only reason some decorators take
arguments and others do not. Drill 9.3 makes you write one.

## Context managers

`with` guarantees cleanup. The pattern is the same one `try/finally` solves in topic 04, with
the cleanup written once instead of at every call site:

```python
with path.open() as f:
    data = f.read()
# f is closed here — even if read() raised
```

The cleanest way to write one is `@contextlib.contextmanager`, which turns a generator into a
context manager — so topic 08 pays off immediately:

```python
from contextlib import contextmanager
from collections.abc import Generator


@contextmanager
def timer(label: str) -> Generator[None, None, None]:
    start = time.perf_counter()
    try:
        yield  # the `with` body runs here
    finally:
        print(f"{label}: {time.perf_counter() - start:.2f}s")
```

Note the return type. Topic 08 said to prefer `Iterator[str]` over `Generator[str, None, None]`
for an ordinary generator, and that still holds — but `@contextmanager` is the exception.
pyright deprecates `Iterator[T]` there, because the decorator needs the send and return types
the fuller form spells out. Three parameters: what it yields, what can be sent in, what it
returns. For a context manager the last two are almost always `None`.

Everything before `yield` is setup. The `yield` is where the `with` block's body executes.
Everything after is teardown. Whatever you yield becomes the `as` variable:

```python
@contextmanager
def collecting() -> Generator[list[str], None, None]:
    items: list[str] = []
    yield items  # `with collecting() as items:` binds this
    print(f"collected {len(items)}")
```

**The `try/finally` around the `yield` is load-bearing.** If the `with` body raises, that
exception is thrown *into* the generator at the `yield` point. Without `try/finally`, your
teardown never runs — which defeats the entire purpose of the construct. This is the single
mistake worth remembering from this topic.

## Where this shows up later

- **Phase 1 `mockstream`** — `@app.post("/v1/chat")` on every route; FastAPI's `lifespan` is a
  context manager.
- **Phase 2** — `async with httpx.AsyncClient() as client:` so connections always close.
- **Phase 6** — a tracing decorator wrapping every LLM call, and a span context manager.

`async with` and `@asynccontextmanager` are Part B. Same shapes, `async` in front.

## Do the drills

`drills/d09_decorators.py`. Six exercises: three decorators, three context managers. One test
checks `__name__` survives; one checks teardown runs when the body raises.
