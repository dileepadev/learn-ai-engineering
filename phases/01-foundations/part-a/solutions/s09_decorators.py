"""Topic 09 — Decorators & context managers: reference solutions."""

from __future__ import annotations

import functools
from collections.abc import Callable, Generator
from contextlib import contextmanager

CALL_LOG: list[str] = []


def logged(fn: Callable[..., str]) -> Callable[..., str]:
    """Wrap `fn` so every call appends its name to CALL_LOG."""

    # functools.wraps copies __name__, __doc__, __module__ and friends from fn
    # onto wrapper. Without it every decorated function is named "wrapper",
    # which breaks pytest's name-based discovery and FastAPI's generated docs.
    @functools.wraps(fn)
    def wrapper(*args: object, **kwargs: object) -> str:
        # Read fn.__name__ here rather than capturing it outside: it costs
        # nothing and keeps the wrapper honest if fn is renamed.
        CALL_LOG.append(fn.__name__)
        return fn(*args, **kwargs)

    return wrapper


def default_on_error(default: str) -> Callable[[Callable[..., str]], Callable[..., str]]:
    """Build a decorator that swallows ValueError and returns `default`."""

    # Three nested functions, one per level: this one takes the OPTION, the next
    # takes the function, the innermost takes the call's arguments. That is the
    # entire difference between @decorator and @decorator(...).
    def decorator(fn: Callable[..., str]) -> Callable[..., str]:
        @functools.wraps(fn)
        def wrapper(*args: object, **kwargs: object) -> str:
            try:
                return fn(*args, **kwargs)
            except ValueError:
                # Narrow on purpose. Catching Exception here would turn a typo
                # inside fn into a silent default, which is a nightmare to trace.
                return default

        return wrapper

    return decorator


def memoized(fn: Callable[[str], str]) -> Callable[[str], str]:
    """Cache results by argument so `fn` runs at most once per input."""
    cache: dict[str, str] = {}

    @functools.wraps(fn)
    def wrapper(arg: str) -> str:
        # `if arg not in cache` rather than `cache.get(arg) or ...`: a legitimate
        # cached result of "" is falsy and would be recomputed forever.
        if arg not in cache:
            cache[arg] = fn(arg)
        return cache[arg]

    return wrapper


@contextmanager
def collecting() -> Generator[list[str], None, None]:
    """A context manager yielding a list that callers append to."""
    items: list[str] = []
    try:
        yield items
    finally:
        # finally, not a bare trailing statement: if the `with` body raises, the
        # exception arrives here at the yield, and only finally still runs.
        items.append("closed")


@contextmanager
def guarded(events: list[str]) -> Generator[None, None, None]:
    """A context manager that records entry and exit, even on failure."""
    events.append("enter")
    try:
        yield
    finally:
        # No `except` clause, so the exception continues on to the caller after
        # this runs -- cleanup without swallowing, exactly as in topic 04.
        events.append("exit")


@contextmanager
def suppressing(events: list[str]) -> Generator[None, None, None]:
    """A context manager that swallows ValueError raised inside its body."""
    events.append("enter")
    try:
        yield
    except ValueError:
        # Catching and NOT re-raising is what tells the `with` statement the
        # exception was handled; the block then completes normally.
        pass
    finally:
        # finally rather than a line after the except, so "exit" is recorded on
        # the success path and the propagating-TypeError path too.
        events.append("exit")
