"""Tests for topic 07 — Just enough OOP."""

from __future__ import annotations

import dataclasses

import pytest
from conftest import load_topic

t = load_topic("07_oop")


def test_usage_exposes_its_fields() -> None:
    usage = t.Usage(input_tokens=10, output_tokens=25)
    assert usage.input_tokens == 10
    assert usage.output_tokens == 25


def test_usage_total_is_a_property_not_a_method() -> None:
    usage = t.Usage(input_tokens=10, output_tokens=25)
    # No parentheses. If total_tokens were a plain method this would compare an
    # int to a bound method object and fail.
    assert usage.total_tokens == 35


def test_usage_total_tracks_field_changes() -> None:
    usage = t.Usage(input_tokens=10, output_tokens=25)
    usage.output_tokens = 90
    assert usage.total_tokens == 100, "total must be derived, not stored at init"


def test_usage_cost_is_a_method_taking_a_rate() -> None:
    usage = t.Usage(input_tokens=500_000, output_tokens=500_000)
    assert usage.cost_usd(3.0) == pytest.approx(3.0)


def test_usage_gets_dataclass_equality() -> None:
    # @dataclass generates __eq__ comparing field by field. A plain class would
    # compare by identity here and fail.
    assert t.Usage(1, 2) == t.Usage(1, 2)
    assert t.Usage(1, 2) != t.Usage(1, 3)


def test_model_ref_builds_a_slug() -> None:
    ref = t.ModelRef(provider="anthropic", name="claude-sonnet-5")
    assert ref.slug == "anthropic/claude-sonnet-5"


def test_model_ref_is_immutable() -> None:
    ref = t.ModelRef(provider="anthropic", name="claude-sonnet-5")
    with pytest.raises(dataclasses.FrozenInstanceError):
        ref.name = "claude-opus-5"


def test_model_ref_is_hashable() -> None:
    # frozen=True generates __hash__, which is what makes this usable as a dict
    # key. A non-frozen dataclass sets __hash__ to None and this raises.
    prices = {t.ModelRef("anthropic", "claude-haiku-4-5"): 0.80}
    assert prices[t.ModelRef("anthropic", "claude-haiku-4-5")] == 0.80


def test_conversation_starts_empty() -> None:
    convo = t.Conversation(title="first")
    assert convo.messages == []


def test_conversation_instances_do_not_share_their_message_list() -> None:
    # The dataclass version of the mutable-default trap. With a shared list,
    # `b.messages` would already contain "hello from a".
    a = t.Conversation(title="a")
    b = t.Conversation(title="b")
    a.add("hello from a")
    assert b.messages == []


def test_conversation_add_appends_in_order() -> None:
    convo = t.Conversation(title="chat")
    convo.add("first")
    convo.add("second")
    assert convo.messages == ["first", "second"]


def test_conversation_accepts_an_explicit_message_list() -> None:
    convo = t.Conversation(title="chat", messages=["existing"])
    convo.add("new")
    assert convo.messages == ["existing", "new"]


def test_word_tokenizer_counts_words() -> None:
    assert t.WordTokenizer().count("hello world again") == 3
    assert t.WordTokenizer().count("") == 0


def test_word_tokenizer_does_not_inherit_from_the_protocol() -> None:
    # The point of a Protocol: matching the shape is enough. Requiring
    # inheritance would make it impossible to type against an SDK you do not own.
    assert t.Tokenizer not in t.WordTokenizer.__mro__


def test_fixed_tokenizer_returns_its_fixed_count() -> None:
    tokenizer = t.FixedTokenizer(42)
    assert tokenizer.count("anything at all") == 42
    assert tokenizer.count("") == 42


def test_fixed_tokenizer_records_what_it_was_asked() -> None:
    tokenizer = t.FixedTokenizer(42)
    tokenizer.count("first")
    tokenizer.count("second")
    assert tokenizer.calls == ["first", "second"]


def test_estimate_cost_works_with_the_real_tokenizer() -> None:
    cost = t.estimate_cost("one two three four", t.WordTokenizer(), 3.0)
    assert cost == pytest.approx(4 / 1_000_000 * 3.0)


def test_estimate_cost_works_with_the_test_double() -> None:
    # Same function, different implementation, no changes to estimate_cost.
    # This is the whole payoff of typing the parameter as a Protocol.
    tokenizer = t.FixedTokenizer(1_000_000)
    assert t.estimate_cost("ignored", tokenizer, 3.0) == pytest.approx(3.0)
    assert tokenizer.calls == ["ignored"]
