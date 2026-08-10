"""Topic 10 — Type hints: reference solutions."""

# No `from __future__ import annotations` here on purpose -- it stringifies
# annotations, which stops TypedDict from seeing NotRequired at runtime and
# silently makes every key required in __required_keys__.
from collections.abc import Iterable
from typing import Literal, NotRequired, TypedDict, assert_never

FinishReason = Literal["end_turn", "max_tokens", "stop_sequence"]

Role = Literal["user", "assistant", "system"]

StreamEvent = Literal["message_start", "content_block_delta", "message_stop"]


class Usage(TypedDict):
    """Token usage as a provider returns it."""

    input_tokens: int
    output_tokens: int
    # NotRequired marks a key that may be absent. Without it, pyright would
    # demand this key at every construction site, and most responses omit it.
    cache_read_tokens: NotRequired[int]


def label_role(role: Role) -> str:
    """Map a role to its display name."""
    if role == "user":
        return "You"
    if role == "assistant":
        return "Claude"
    if role == "system":
        return "System"

    # assert_never is the exhaustiveness check. pyright narrows `role` to Never
    # here only if every Literal member was handled above; add a fourth role to
    # Role and this line becomes a type error pointing straight at the gap.
    # At runtime it is unreachable, which is exactly the intent.
    assert_never(role)


def total_tokens(usage: Usage) -> int:
    """Sum all token counts in a usage record, including the optional key."""
    # .get() with a default is what satisfies pyright for a NotRequired key --
    # usage["cache_read_tokens"] would be a type error, because the key is not
    # guaranteed to exist.
    return usage["input_tokens"] + usage["output_tokens"] + usage.get("cache_read_tokens", 0)


def first_matching(items: Iterable[str], prefix: str) -> str | None:
    """Return the first item starting with `prefix`, or None."""
    for item in items:
        if item.startswith(prefix):
            return item
    # The explicit None return matches the declared `str | None`. Falling off
    # the end returns None too, but stating it keeps the contract obvious.
    return None


def describe_event(event: StreamEvent, payload: dict[str, object]) -> str:
    """Render a one-line description of a stream event."""
    if event == "message_start":
        return "start"

    if event == "content_block_delta":
        text = payload.get("text")
        # The isinstance check is what `object` buys you. With `Any` this line
        # could be skipped and a non-str payload would produce "delta: None"
        # or crash somewhere downstream instead of being handled here.
        return f"delta: {text}" if isinstance(text, str) else "delta: "

    if event == "message_stop":
        return "stop"

    assert_never(event)


class Message(TypedDict):
    """A chat message."""

    role: Role
    content: str
    name: NotRequired[str]


def render_transcript(messages: list[Message]) -> str:
    """Render messages as "<Label>: <content>" lines."""
    return "\n".join(f"{label_role(m['role'])}: {m['content']}" for m in messages)
