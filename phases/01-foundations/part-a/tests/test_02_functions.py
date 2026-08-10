"""Tests for topic 02 — Functions, properly."""

from __future__ import annotations

import pytest
from conftest import load_topic

t = load_topic("02_functions")


def test_append_tag_creates_a_list_when_none_given() -> None:
    assert t.append_tag("python") == ["python"]


def test_append_tag_does_not_share_state_between_calls() -> None:
    # The mutable-default trap. With `tags: list[str] = []` the second call
    # returns ["first", "second"] because both calls share one list object.
    first = t.append_tag("first")
    second = t.append_tag("second")
    assert first == ["first"]
    assert second == ["second"]


def test_append_tag_appends_to_a_provided_list() -> None:
    tags = ["existing"]
    result = t.append_tag("new", tags)
    assert result == ["existing", "new"]
    # When a list IS passed, mutating it in place is the expected behaviour.
    assert tags == ["existing", "new"]


def test_sum_tokens_totals_its_arguments() -> None:
    assert t.sum_tokens(10, 20, 30) == 60
    assert t.sum_tokens(5) == 5


def test_sum_tokens_with_no_arguments() -> None:
    assert t.sum_tokens() == 0


def test_build_request_uses_defaults() -> None:
    assert t.build_request("claude-sonnet-5") == {
        "model": "claude-sonnet-5",
        "temperature": 0.7,
        "max_tokens": 1024,
    }


def test_build_request_passes_unknown_options_through() -> None:
    payload = t.build_request("claude-opus-5", max_tokens=4096, top_p=0.9, stop_sequences=["\n"])
    assert payload == {
        "model": "claude-opus-5",
        "temperature": 0.7,
        "max_tokens": 4096,
        "top_p": 0.9,
        "stop_sequences": ["\n"],
    }


def test_build_request_options_are_keyword_only() -> None:
    # The bare `*` in the signature makes this a TypeError, which is the point:
    # nobody can pass temperature and max_tokens in the wrong positional order.
    with pytest.raises(TypeError):
        t.build_request("claude-sonnet-5", 0.2)  # pyright: ignore[reportCallIssue]


def test_make_counter_counts_up_from_one() -> None:
    counter = t.make_counter()
    assert counter() == 1
    assert counter() == 2
    assert counter() == 3


def test_make_counter_instances_are_independent() -> None:
    a = t.make_counter()
    b = t.make_counter()
    a()
    a()
    assert b() == 1, "each counter needs its own captured variable"


def test_make_price_formatter_captures_the_rate() -> None:
    haiku = t.make_price_formatter(0.80)
    assert haiku(50_000) == "$0.0400"


def test_make_price_formatter_instances_are_independent() -> None:
    cheap = t.make_price_formatter(0.80)
    pricey = t.make_price_formatter(15.0)
    assert cheap(1_000_000) == "$0.8000"
    assert pricey(1_000_000) == "$15.0000"


def test_apply_all_runs_transforms_in_order() -> None:
    assert t.apply_all("  Hello  ", [str.strip, str.lower]) == "hello"


def test_apply_all_order_matters() -> None:
    # Reversing the transforms changes the result, which proves each transform
    # is fed the previous one's output rather than the original value.
    def bracket(s: str) -> str:
        return f"[{s}]"

    assert t.apply_all("  hi  ", [str.strip, bracket]) == "[hi]"
    assert t.apply_all("  hi  ", [bracket, str.strip]) == "[  hi  ]"


def test_apply_all_with_no_transforms() -> None:
    assert t.apply_all("unchanged", []) == "unchanged"
