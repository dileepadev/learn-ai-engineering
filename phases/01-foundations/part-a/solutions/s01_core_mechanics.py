"""Topic 01 — Core mechanics: reference solutions.

Comments explain *why*, not what. If a line's purpose is obvious, it has no
comment; that is the standard for the whole repo.
"""

from __future__ import annotations

Message = dict[str, str]


def unique_preserving_order(items: list[str]) -> list[str]:
    """Drop duplicates while keeping first-seen order."""
    # Two containers, each doing what it is best at: the set answers "seen it?"
    # in O(1), the list preserves order. Using only the list would make the
    # membership test O(n) and the whole function O(n^2).
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def count_roles(messages: list[Message]) -> dict[str, int]:
    """Count how many messages each role sent."""
    counts: dict[str, int] = {}
    for message in messages:
        # Square brackets, not .get("role"): a message without a role is
        # malformed, and a loud KeyError here beats a silent None key later.
        role = message["role"]
        counts[role] = counts.get(role, 0) + 1
    return counts


def last_n_messages(messages: list[Message], n: int) -> list[Message]:
    """Return the most recent `n` messages, oldest first."""
    # The guard exists because -0 == 0, so `messages[-0:]` is `messages[0:]` --
    # asking for zero messages would otherwise return all of them.
    if n <= 0:
        return []
    return messages[-n:]


def describe_usage(prompt_tokens: int, completion_tokens: int, usd_per_million: float) -> str:
    """Format a token-usage line for a terminal report."""
    total = prompt_tokens + completion_tokens
    cost = (total / 1_000_000) * usd_per_million
    return f"{prompt_tokens:,} in + {completion_tokens:,} out = {total:,} tokens (${cost:.4f})"


def is_blank(value: str | None) -> bool:
    """Is this value missing, empty, or only whitespace?"""
    # `is None` first: calling .strip() on None would raise AttributeError.
    # Python's `or` short-circuits, so the second half never runs when value is None.
    return value is None or not value.strip()


def merge_config(defaults: dict[str, str], overrides: dict[str, str]) -> dict[str, str]:
    """Layer `overrides` on top of `defaults` without touching either input."""
    # `{**a, **b}` builds a new dict. `defaults.update(overrides)` would mutate
    # the caller's dict -- dicts are passed by reference, so that edit escapes
    # this function and corrupts whatever else holds a reference to it.
    return {**defaults, **overrides}


def split_by_role(messages: list[Message], role: str) -> tuple[list[Message], list[Message]]:
    """Partition messages into (matching, everything else)."""
    matching: list[Message] = []
    others: list[Message] = []
    for message in messages:
        # One pass, appending to whichever list applies. Two separate list
        # comprehensions would also work but would iterate the input twice.
        if message.get("role") == role:
            matching.append(message)
        else:
            others.append(message)
    return matching, others
