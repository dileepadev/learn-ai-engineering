"""Tests for topic 01 — Core mechanics.

Every test here is also a specification: if a docstring in the drill file is
ambiguous, the assertion below is the answer.
"""

from __future__ import annotations

import pytest
from conftest import load_topic

t = load_topic("01_core_mechanics")


def test_unique_preserving_order_keeps_first_occurrence() -> None:
    assert t.unique_preserving_order(["b", "a", "b", "c", "a"]) == ["b", "a", "c"]


def test_unique_preserving_order_handles_empty_and_no_duplicates() -> None:
    assert t.unique_preserving_order([]) == []
    assert t.unique_preserving_order(["x", "y"]) == ["x", "y"]


def test_count_roles_counts_each_role() -> None:
    messages = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
        {"role": "user", "content": "bye"},
    ]
    assert t.count_roles(messages) == {"user": 2, "assistant": 1}


def test_count_roles_on_empty_input() -> None:
    assert t.count_roles([]) == {}


def test_count_roles_raises_on_malformed_message() -> None:
    # A message with no role is a bug in the caller. Fail loudly, do not skip it.
    with pytest.raises(KeyError):
        t.count_roles([{"content": "orphaned"}])


def test_last_n_messages_returns_the_tail_oldest_first() -> None:
    messages = [{"role": "user", "content": str(i)} for i in range(5)]
    assert t.last_n_messages(messages, 2) == [
        {"role": "user", "content": "3"},
        {"role": "user", "content": "4"},
    ]


def test_last_n_messages_with_zero_returns_nothing() -> None:
    # The -0 trap: a naive `messages[-n:]` returns the whole list here.
    messages = [{"role": "user", "content": str(i)} for i in range(5)]
    assert t.last_n_messages(messages, 0) == []


def test_last_n_messages_when_n_exceeds_length() -> None:
    messages = [{"role": "user", "content": "only"}]
    assert t.last_n_messages(messages, 10) == messages


def test_describe_usage_formats_counts_and_cost() -> None:
    assert t.describe_usage(1000, 500, 3.0) == "1,000 in + 500 out = 1,500 tokens ($0.0045)"


def test_describe_usage_with_zero_tokens() -> None:
    assert t.describe_usage(0, 0, 3.0) == "0 in + 0 out = 0 tokens ($0.0000)"


def test_is_blank_distinguishes_missing_empty_and_real_values() -> None:
    assert t.is_blank(None) is True
    assert t.is_blank("") is True
    assert t.is_blank("   \n") is True
    assert t.is_blank("hello") is False
    # "0" is a real, non-blank string even though int 0 would be falsy.
    assert t.is_blank("0") is False


def test_merge_config_overrides_win() -> None:
    defaults = {"model": "haiku", "temperature": "0"}
    overrides = {"model": "opus"}
    assert t.merge_config(defaults, overrides) == {"model": "opus", "temperature": "0"}


def test_merge_config_does_not_mutate_its_inputs() -> None:
    defaults = {"model": "haiku"}
    overrides = {"model": "opus"}
    t.merge_config(defaults, overrides)
    assert defaults == {"model": "haiku"}, "merge_config mutated the defaults dict"
    assert overrides == {"model": "opus"}


def test_split_by_role_partitions_and_keeps_order() -> None:
    messages = [
        {"role": "user", "content": "a"},
        {"role": "assistant", "content": "b"},
        {"role": "user", "content": "c"},
    ]
    mine, theirs = t.split_by_role(messages, "user")
    assert mine == [{"role": "user", "content": "a"}, {"role": "user", "content": "c"}]
    assert theirs == [{"role": "assistant", "content": "b"}]


def test_split_by_role_with_no_matches() -> None:
    messages = [{"role": "assistant", "content": "b"}]
    mine, theirs = t.split_by_role(messages, "user")
    assert mine == []
    assert theirs == messages
