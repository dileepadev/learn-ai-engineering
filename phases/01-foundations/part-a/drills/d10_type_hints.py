"""Topic 10 — Type hints.

Read `lessons/10-type-hints.md` first.

This topic has two graders. `pytest` checks behaviour; `uv run pyright` checks
the annotations. An implementation can pass one and fail the other — run both.

    uv run pytest phases/01-foundations/part-a/tests/test_10_type_hints.py
    uv run pyright
"""

# Note: unlike the other drill files, this one deliberately does NOT use
# `from __future__ import annotations`. That import turns every annotation into
# a string, and TypedDict then cannot see `NotRequired` at runtime -- so
# `Usage.__required_keys__` comes out wrong and a test below fails. Python 3.12
# needs no such import for `str | None` or `list[str]` anyway.
from collections.abc import Iterable
from typing import Literal, NotRequired, TypedDict

# Given as the worked example — this is the shape you are copying. A model's
# stop reason is a closed set of three strings, so it gets a Literal rather
# than a bare `str`, and pyright rejects anything else at every call site.
FinishReason = Literal["end_turn", "max_tokens", "stop_sequence"]

# Exercise 10.1 — replace `str` with a Literal listing exactly these three
# values: "user", "assistant", "system". Everything below depends on it, and
# pyright will start rejecting typos at every call site once you do.
Role = str

# Exercise 10.2 — a Literal for stream event types: "message_start",
# "content_block_delta", "message_stop". These mirror the real event names in
# Anthropic's streaming API, which you will consume in Phase 2.
StreamEvent = str


class Usage(TypedDict):
    """Token usage as a provider returns it.

    Exercise 10.3. Give this TypedDict two required int keys, `input_tokens`
    and `output_tokens`, plus one optional int key `cache_read_tokens` — some
    responses include it, most do not. The lesson names the marker for
    "may be absent".

    At runtime this is a plain dict; the annotations exist purely so pyright
    can catch a misspelled key before the network call does.
    """

    # Exercise 10.3 — replace this line with the three keys.
    placeholder: NotRequired[int]


def label_role(role: Role) -> str:
    """Map a role to its display name.

    Exercise 10.4:
        "user" -> "You", "assistant" -> "Claude", "system" -> "System"

    Once `Role` is a Literal, pyright can verify you handled every case. Write
    it so that adding a fourth role to `Role` would make pyright complain here
    rather than failing silently at runtime.

    Args:
        role: The message role.

    Returns:
        The display label.
    """
    raise NotImplementedError("Exercise 10.4")


def total_tokens(usage: Usage) -> int:
    """Sum all token counts in a usage record, including the optional key.

    `usage["cache_read_tokens"]` may not exist. Since Usage marks it optional,
    pyright requires you to prove it is present before reading it — use the
    dict method that supplies a default.

    Args:
        usage: A usage record.

    Returns:
        input + output + cache_read (0 when absent).
    """
    raise NotImplementedError("Exercise 10.5")


def first_matching(items: Iterable[str], prefix: str) -> str | None:
    """Return the first item starting with `prefix`, or None.

    Note the signature, and copy the pattern in your own code: `Iterable[str]`
    accepts lists, tuples, sets, and generators — generous in. `str | None`
    tells the caller exactly what they must handle — specific out.

    Args:
        items: Candidates, in order.
        prefix: The prefix to match.

    Returns:
        The first match, or None if nothing matched.
    """
    raise NotImplementedError("Exercise 10.6")


def describe_event(event: StreamEvent, payload: dict[str, object]) -> str:
    """Render a one-line description of a stream event.

    Exercise 10.7. Expected output per event type:
      - "message_start"       -> "start"
      - "content_block_delta" -> "delta: <text>", where <text> is
        payload["text"] if present and a str, otherwise ""
      - "message_stop"        -> "stop"

    `payload` is typed `dict[str, object]`, not `dict[str, Any]`, so pyright
    forces you to narrow with `isinstance` before treating the value as a str.
    That is deliberate: this is a JSON boundary, and `Any` would switch off
    checking for everything downstream.

    Args:
        event: The event type.
        payload: The raw event payload.

    Returns:
        The formatted description.
    """
    raise NotImplementedError("Exercise 10.7")


class Message(TypedDict):
    """A chat message, given to you as the worked example.

    `role` uses the Literal you defined, so pyright rejects Message(role="usr")
    at the construction site. `name` is optional — some providers accept it to
    disambiguate multiple participants.
    """

    role: Role
    content: str
    name: NotRequired[str]


def render_transcript(messages: list[Message]) -> str:
    """Render messages as "<Label>: <content>" lines.

    Exercise 10.8. Use `label_role`. Join lines with "\\n". An empty list
    renders as an empty string.

    Args:
        messages: The conversation.

    Returns:
        The rendered transcript.
    """
    raise NotImplementedError("Exercise 10.8")
