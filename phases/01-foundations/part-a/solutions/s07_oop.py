"""Topic 07 — Just enough OOP: reference solutions."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class Usage:
    """Token usage for one model call, with a derived total."""

    input_tokens: int
    output_tokens: int

    @property
    def total_tokens(self) -> int:
        # A property, not a stored field: storing it would let the three numbers
        # drift out of agreement the moment anyone assigns to input_tokens.
        return self.input_tokens + self.output_tokens

    def cost_usd(self, usd_per_million: float) -> float:
        """Cost of this usage at the given price per million tokens."""
        # A method rather than a property because it takes an argument -- and
        # because the parentheses signal "this depends on something external".
        return self.total_tokens / 1_000_000 * usd_per_million


@dataclass(frozen=True)
class ModelRef:
    """An immutable reference to a provider's model."""

    provider: str
    name: str

    @property
    def slug(self) -> str:
        return f"{self.provider}/{self.name}"


@dataclass
class Conversation:
    """A chat history that starts empty."""

    title: str
    # default_factory calls the factory once per instance. A bare `= []` would
    # share one list across every Conversation -- the same trap as topic 02's
    # mutable default, which is why dataclasses reject that spelling outright.
    #
    # `list[str]` rather than plain `list`: both work at runtime, but a bare
    # `list` leaves pyright with list[Unknown] and fails strict mode.
    messages: list[str] = field(default_factory=list[str])

    def add(self, message: str) -> None:
        """Append a message to this conversation."""
        self.messages.append(message)


class Tokenizer(Protocol):
    """The shape of anything that can count tokens in text."""

    def count(self, text: str) -> int:
        """Return the number of tokens in `text`."""
        ...


class WordTokenizer:
    """A real tokenizer: one token per whitespace-separated word."""

    # Deliberately does NOT inherit from Tokenizer. pyright still accepts it
    # wherever a Tokenizer is required, because the shape matches. That is
    # structural typing, and it is what lets you type against classes you do
    # not own -- like a provider's SDK client.
    def count(self, text: str) -> int:
        """Return the number of whitespace-separated words in `text`."""
        return len(text.split())


class FixedTokenizer:
    """A test double: always reports the same count, and records its calls."""

    def __init__(self, fixed_count: int) -> None:
        self.fixed_count = fixed_count
        # Recording calls is what makes this a useful double rather than just a
        # stub: a test can assert on what the code under test actually asked for.
        self.calls: list[str] = []

    def count(self, text: str) -> int:
        """Return the fixed count, recording the call."""
        self.calls.append(text)
        return self.fixed_count


def estimate_cost(text: str, tokenizer: Tokenizer, usd_per_million: float) -> float:
    """Estimate what it costs to send `text` to a model."""
    return tokenizer.count(text) / 1_000_000 * usd_per_million
