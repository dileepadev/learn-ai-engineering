"""Topic 09 — Decorators & context managers.

Read `lessons/09-decorators-and-context-managers.md` first.

Exercises 9.4 to 9.6 are already decorated with `@contextmanager` and annotated
as generators — that is the correct shape, so leave the signature alone and
write the body: setup, `yield`, teardown.

    uv run pytest phases/01-foundations/part-a/tests/test_09_decorators.py
"""

from __future__ import annotations

from collections.abc import Callable, Generator
from contextlib import contextmanager

CALL_LOG: list[str] = []


def logged(fn: Callable[..., str]) -> Callable[..., str]:
    """Wrap `fn` so every call appends its name to CALL_LOG.

    Exercise 9.1. The wrapper must:
      - accept any arguments (`*args`, `**kwargs`) and forward them unchanged
      - append `fn.__name__` to CALL_LOG before calling
      - return whatever `fn` returned

    And it must preserve the wrapped function's `__name__` and `__doc__`. The
    lesson names the one-line tool for that; a test fails without it, because
    losing metadata breaks pytest discovery, FastAPI's docs, and tracebacks.

    Args:
        fn: The function to wrap.

    Returns:
        A replacement function with the same signature and metadata.
    """
    raise NotImplementedError("Exercise 9.1")


def default_on_error(default: str) -> Callable[[Callable[..., str]], Callable[..., str]]:
    """Build a decorator that swallows ValueError and returns `default`.

    Exercise 9.2 — a decorator FACTORY, the `@app.get("/health")` shape. Note
    the return type: this function returns a decorator, which then returns the
    wrapper. Three levels, and the middle one is the decorator proper.

    Only ValueError is caught, per topic 04. Anything else propagates.

    Usage:

        @default_on_error("unknown")
        def parse(raw: str) -> str: ...

    Args:
        default: Returned when the wrapped function raises ValueError.

    Returns:
        A decorator.
    """
    raise NotImplementedError("Exercise 9.2")


def memoized(fn: Callable[[str], str]) -> Callable[[str], str]:
    """Cache results by argument so `fn` runs at most once per input.

    Exercise 9.3. A single-argument cache — the idea behind
    `functools.lru_cache` and, later, prompt caching. Write the dict yourself
    rather than delegating; the point is to see the mechanism.

    Preserve metadata here too.

    Args:
        fn: A pure function of one string argument.

    Returns:
        A caching replacement.
    """
    raise NotImplementedError("Exercise 9.3")


@contextmanager
def collecting() -> Generator[list[str], None, None]:
    """A context manager yielding a list that callers append to.

    Exercise 9.4. Everything before the `yield` is setup; the value you yield
    becomes the `as` target; everything after is teardown:

        with collecting() as items:
            items.append("a")

    Create an empty list, yield it, then append the string "closed" to it —
    that is how the test observes that teardown ran.

    Yields:
        The list being collected into.
    """
    raise NotImplementedError("Exercise 9.4")


@contextmanager
def guarded(events: list[str]) -> Generator[None, None, None]:
    """A context manager that records entry and exit, even on failure.

    Exercise 9.5. Append "enter" before the body runs and "exit" after it,
    yielding None in between.

    The teardown must run when the `with` body raises — and the exception must
    still propagate. An exception in the body is thrown back INTO this
    generator at the `yield`, so a plain `yield` followed by the teardown will
    never reach the teardown. The lesson names the construct that fixes it.

    Args:
        events: A list to record into.

    Yields:
        Nothing.
    """
    raise NotImplementedError("Exercise 9.5")


@contextmanager
def suppressing(events: list[str]) -> Generator[None, None, None]:
    """A context manager that swallows ValueError raised inside its body.

    Exercise 9.6. Append "enter" on entry and "exit" on exit, as in 9.5. But
    when the body raises ValueError, catch it around the `yield` and do NOT
    re-raise — the `with` statement then completes normally.

    This is how `contextlib.suppress` works. Any other exception type must
    still propagate, and "exit" must be recorded either way.

    Args:
        events: A list to record into.

    Yields:
        Nothing.
    """
    raise NotImplementedError("Exercise 9.6")
