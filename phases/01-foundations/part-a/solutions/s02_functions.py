"""Topic 02 — Functions, properly: reference solutions."""

from __future__ import annotations

from collections.abc import Callable


def append_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    """Append `tag` to `tags`, creating a fresh list when none is given."""
    # The `None` sentinel is the whole point. `tags: list[str] = []` would
    # evaluate that list once at def-time and share it across every call.
    if tags is None:
        tags = []
    tags.append(tag)
    return tags


def sum_tokens(*counts: int) -> int:
    """Total any number of token counts."""
    return sum(counts)


def build_request(
    model: str,
    *,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    **extra: object,
) -> dict[str, object]:
    """Assemble a provider request payload."""
    payload: dict[str, object] = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    # Spreading `extra` last lets a caller override a named default -- the same
    # precedence rule as merge_config in topic 01.
    return {**payload, **extra}


def make_counter() -> Callable[[], int]:
    """Build a function that returns 1, then 2, then 3, ... on each call."""
    count = 0

    def increment() -> int:
        # Without `nonlocal`, `count += 1` would treat count as a new local and
        # raise UnboundLocalError -- assignment creates a local unless told not to.
        nonlocal count
        count += 1
        return count

    # Each call to make_counter() creates its own `count`, so counters are independent.
    return increment


def make_price_formatter(usd_per_million: float) -> Callable[[int], str]:
    """Build a formatter that prices a token count for one specific model."""

    def format_price(tokens: int) -> str:
        # `usd_per_million` is captured from the enclosing scope and stays alive
        # after make_price_formatter has returned. That is the closure.
        return f"${tokens / 1_000_000 * usd_per_million:.4f}"

    return format_price


def apply_all(value: str, transforms: list[Callable[[str], str]]) -> str:
    """Run `value` through each transform in order, feeding each result forward."""
    for transform in transforms:
        value = transform(value)
    return value
