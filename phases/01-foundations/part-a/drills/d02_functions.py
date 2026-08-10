"""Topic 02 — Functions, properly.

Read `lessons/02-functions.md` first.

    uv run pytest phases/01-foundations/part-a/tests/test_02_functions.py
"""

from __future__ import annotations

from collections.abc import Callable


def append_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    """Append `tag` to `tags`, creating a fresh list when none is given.

    The signature already uses the `None` sentinel — your job is the body. The
    test calls this twice with no `tags` argument and asserts the second call
    does not see the first call's data.

    Args:
        tag: The tag to add.
        tags: An existing list to append to. None means "start a new one".

    Returns:
        The list containing `tag`. When `tags` was passed, that same list
        object, mutated. When it was None, a brand new list.
    """
    raise NotImplementedError("Exercise 2.1")


def sum_tokens(*counts: int) -> int:
    """Total any number of token counts.

    Exercises `*args`. Inside the function, `counts` is a tuple of ints.
    Zero arguments is legal and totals 0.

    Args:
        *counts: Token counts to add together.

    Returns:
        Their sum.
    """
    raise NotImplementedError("Exercise 2.2")


def build_request(
    model: str,
    *,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    **extra: object,
) -> dict[str, object]:
    """Assemble a provider request payload.

    This is the wrapper shape you will write for real in Phase 2: named options
    with sensible defaults, plus `**extra` so a provider parameter you have
    never heard of still passes through.

    Note the bare `*`: `temperature` and `max_tokens` are keyword-only, so
    nobody can accidentally pass them positionally in the wrong order.

    Args:
        model: The model ID.
        temperature: Sampling temperature.
        max_tokens: Output token cap.
        **extra: Any additional provider parameters, passed straight through.

    Returns:
        A dict with keys "model", "temperature", "max_tokens", plus whatever
        was in `extra`. Keys from `extra` win on conflict.
    """
    raise NotImplementedError("Exercise 2.3")


def make_counter() -> Callable[[], int]:
    """Build a function that returns 1, then 2, then 3, ... on each call.

    Exercises closures and `nonlocal`. Two counters built by two separate calls
    to `make_counter()` must be independent — the test checks that.

    Returns:
        A zero-argument function yielding successive integers from 1.
    """
    raise NotImplementedError("Exercise 2.4")


def make_price_formatter(usd_per_million: float) -> Callable[[int], str]:
    """Build a formatter that prices a token count for one specific model.

    Configuration-by-construction: capture the rate once, then call the
    returned function without re-passing it. For a rate of 0.80, a call with
    50_000 tokens must return exactly "$0.0400" — four decimal places.

    Args:
        usd_per_million: Dollars per million tokens for some model.

    Returns:
        A function mapping a token count to a formatted price string.
    """
    raise NotImplementedError("Exercise 2.5")


def apply_all(value: str, transforms: list[Callable[[str], str]]) -> str:
    """Run `value` through each transform in order, feeding each result forward.

    Exercises functions-as-values. An empty transform list returns `value`
    unchanged.

    Args:
        value: The starting string.
        transforms: Functions applied left to right.

    Returns:
        The value after every transform has run.
    """
    raise NotImplementedError("Exercise 2.6")
