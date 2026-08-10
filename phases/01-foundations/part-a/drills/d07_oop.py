"""Topic 07 — Just enough OOP.

Read `lessons/07-oop-just-enough.md` first.

Some exercises here ask you to write a class body rather than a function body.
Where a class is already declared with `pass`, replace the `pass`.

    uv run pytest phases/01-foundations/part-a/tests/test_07_oop.py
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class Usage:
    """Token usage for one model call, with a derived total.

    Exercise 7.1. Give this dataclass three things:
      - `input_tokens: int` and `output_tokens: int` fields
      - a `total_tokens` property returning their sum
      - a `cost_usd` method taking `usd_per_million: float` and returning the
        dollar cost of `total_tokens` at that rate

    `total_tokens` is accessed WITHOUT parentheses; `cost_usd(3.0)` is called
    with them. That difference is the whole point of @property.
    """

    # Exercise 7.1 — replace this line with the fields, property, and method.
    _: int = 0


@dataclass(frozen=True)
class ModelRef:
    """An immutable reference to a provider's model.

    Exercise 7.2. Fields: `provider: str` and `name: str`. Add a `slug`
    property returning "provider/name", e.g. "anthropic/claude-sonnet-5".

    Frozen means instances are immutable AND hashable, so they work as dict
    keys and set members — the test relies on that. Assigning to a field after
    construction must raise.
    """

    # Exercise 7.2 — replace this line.
    _: int = 0


@dataclass
class Conversation:
    """A chat history that starts empty.

    Exercise 7.3. Fields:
      - `title: str`
      - `messages: list[str]`, defaulting to an empty list

    The default is the trap. `messages: list[str] = []` will not even compile —
    dataclasses reject it at class-definition time. Use the tool the lesson
    names instead, so each Conversation gets its OWN list.

    Pass the factory as `list[str]`, not bare `list`: both behave identically
    at runtime, but the bare form leaves pyright with `list[Unknown]` and fails
    `uv run pyright` under this repo's strict setting.

    Also add an `add(self, message: str) -> None` method that appends.
    """

    # Exercise 7.3 — replace this line.
    _: int = 0


class Tokenizer(Protocol):
    """The shape of anything that can count tokens in text.

    Given to you as the example. Note that it inherits from Protocol and its
    method body is `...` — there is nothing to implement here. Implementers do
    NOT import or subclass this; they just happen to match.
    """

    def count(self, text: str) -> int:
        """Return the number of tokens in `text`."""
        ...


class WordTokenizer:
    """A real tokenizer: one token per whitespace-separated word.

    Exercise 7.4. Implement `count`. Do not inherit from Tokenizer — the point
    of a Protocol is that you do not have to. The test asserts this class
    satisfies the Protocol anyway.
    """

    def count(self, text: str) -> int:
        """Return the number of whitespace-separated words in `text`."""
        raise NotImplementedError("Exercise 7.4")


class FixedTokenizer:
    """A test double: always reports the same count, and records its calls.

    Exercise 7.5. Implement:
      - `__init__(self, fixed_count: int) -> None`, which also sets
        `self.calls: list[str] = []`
      - `count(self, text: str) -> int`, which appends `text` to `self.calls`
        and returns the fixed count

    This is the `mockstream` pattern: same shape as the real thing, no real
    work, and it remembers what it was asked so a test can assert on it.
    """

    def __init__(self, fixed_count: int) -> None:
        raise NotImplementedError("Exercise 7.5")

    def count(self, text: str) -> int:
        """Return the fixed count, recording the call."""
        raise NotImplementedError("Exercise 7.5")


def estimate_cost(text: str, tokenizer: Tokenizer, usd_per_million: float) -> float:
    """Estimate what it costs to send `text` to a model.

    Exercise 7.6. Note the parameter type: `Tokenizer`, the Protocol. This
    function works with WordTokenizer, FixedTokenizer, or anything else with a
    matching `count` method — and it never needs to know which.

    Args:
        text: The text to price.
        tokenizer: Anything that can count tokens.
        usd_per_million: Dollars per million tokens.

    Returns:
        The cost in dollars: (tokens / 1_000_000) * usd_per_million.
    """
    raise NotImplementedError("Exercise 7.6")
