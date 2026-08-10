"""Tests for topic 10 — Type hints.

pytest can only check runtime behaviour. The annotations themselves are graded
by `uv run pyright` — run both. A few tests here inspect the type aliases with
`typing.get_args`, which is the closest pytest can get to checking a Literal.
"""

from __future__ import annotations

from typing import get_args

from conftest import load_topic

t = load_topic("10_type_hints")


def test_role_is_a_literal_with_three_values() -> None:
    # get_args returns () for a plain `str` alias and the members for a Literal.
    assert set(get_args(t.Role)) == {"user", "assistant", "system"}


def test_stream_event_is_a_literal_with_three_values() -> None:
    assert set(get_args(t.StreamEvent)) == {
        "message_start",
        "content_block_delta",
        "message_stop",
    }


def test_usage_declares_the_expected_keys() -> None:
    assert set(t.Usage.__annotations__) == {
        "input_tokens",
        "output_tokens",
        "cache_read_tokens",
    }


def test_usage_marks_only_cache_read_as_optional() -> None:
    # TypedDict records which keys may be omitted; NotRequired is what puts a
    # key in __optional_keys__ rather than __required_keys__.
    assert t.Usage.__required_keys__ == frozenset({"input_tokens", "output_tokens"})
    assert t.Usage.__optional_keys__ == frozenset({"cache_read_tokens"})


def test_usage_is_a_plain_dict_at_runtime() -> None:
    usage = t.Usage(input_tokens=10, output_tokens=25)
    assert usage == {"input_tokens": 10, "output_tokens": 25}
    assert isinstance(usage, dict)


def test_label_role_maps_every_role() -> None:
    assert t.label_role("user") == "You"
    assert t.label_role("assistant") == "Claude"
    assert t.label_role("system") == "System"


def test_total_tokens_without_the_optional_key() -> None:
    assert t.total_tokens({"input_tokens": 10, "output_tokens": 25}) == 35


def test_total_tokens_with_the_optional_key() -> None:
    usage = {"input_tokens": 10, "output_tokens": 25, "cache_read_tokens": 100}
    assert t.total_tokens(usage) == 135


def test_first_matching_finds_the_first_match() -> None:
    assert t.first_matching(["alpha", "beta", "banana"], "b") == "beta"


def test_first_matching_returns_none_when_nothing_matches() -> None:
    assert t.first_matching(["alpha"], "z") is None


def test_first_matching_accepts_any_iterable() -> None:
    # `Iterable[str]` rather than `list[str]` is what makes all three work.
    assert t.first_matching(("alpha", "beta"), "b") == "beta"
    assert t.first_matching((x for x in ["alpha", "beta"]), "b") == "beta"


def test_first_matching_stops_at_the_first_hit() -> None:
    seen: list[str] = []

    def watched() -> object:
        for item in ["alpha", "beta", "gamma"]:
            seen.append(item)
            yield item

    assert t.first_matching(watched(), "b") == "beta"
    assert seen == ["alpha", "beta"], "should not consume past the first match"


def test_describe_event_start_and_stop() -> None:
    assert t.describe_event("message_start", {}) == "start"
    assert t.describe_event("message_stop", {}) == "stop"


def test_describe_event_delta_with_text() -> None:
    assert t.describe_event("content_block_delta", {"text": "Hel"}) == "delta: Hel"


def test_describe_event_delta_without_text() -> None:
    assert t.describe_event("content_block_delta", {}) == "delta: "


def test_describe_event_delta_with_a_non_string_payload() -> None:
    # The isinstance narrowing the `object` annotation forces you to write.
    assert t.describe_event("content_block_delta", {"text": 42}) == "delta: "


def test_render_transcript_labels_each_line() -> None:
    messages = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    assert t.render_transcript(messages) == "You: hi\nClaude: hello"


def test_render_transcript_on_empty_input() -> None:
    assert t.render_transcript([]) == ""


def test_render_transcript_includes_system_messages() -> None:
    messages = [{"role": "system", "content": "be brief"}]
    assert t.render_transcript(messages) == "System: be brief"
