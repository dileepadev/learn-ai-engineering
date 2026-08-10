"""Tests for topic 08 — Generators & iterators.

Several tests here assert on laziness rather than values: they check that no
work has happened before the caller asks for the first item. Returning a list
fails those even when every value is correct.
"""

from __future__ import annotations

import inspect
from collections.abc import Iterator

import pytest
from conftest import load_topic

t = load_topic("08_generators")


def counting_stream(values: list[str], seen: list[str]) -> Iterator[str]:
    """A stream that records each value at the moment it is produced.

    Comparing `seen` against expectations is how the tests below observe
    laziness from the outside.
    """
    for value in values:
        seen.append(value)
        yield value


def test_stream_words_yields_each_word() -> None:
    assert list(t.stream_words("hello world again")) == ["hello", "world", "again"]


def test_stream_words_returns_a_generator_not_a_list() -> None:
    result = t.stream_words("hello world")
    assert inspect.isgenerator(result), "use yield; do not build and return a list"


def test_stream_words_runs_nothing_until_iterated() -> None:
    # Calling a generator function executes none of its body. If stream_words
    # were written to return a list, this would already be a list of two items.
    gen = t.stream_words("hello world")
    assert next(gen) == "hello"
    assert next(gen) == "world"
    with pytest.raises(StopIteration):
        next(gen)


def test_stream_words_on_empty_text() -> None:
    assert list(t.stream_words("")) == []


def test_stream_with_done_appends_the_sentinel() -> None:
    assert list(t.stream_with_done(["a", "b"])) == ["a", "b", "[DONE]"]


def test_stream_with_done_on_empty_input_still_terminates() -> None:
    assert list(t.stream_with_done([])) == ["[DONE]"]


def test_stream_with_done_stays_lazy() -> None:
    seen: list[str] = []
    gen = t.stream_with_done(counting_stream(["a", "b"], seen))
    assert seen == [], "nothing should be produced before the first next()"
    assert next(gen) == "a"
    assert seen == ["a"], "only the first chunk should have been pulled"


def test_stream_conversation_separates_messages() -> None:
    assert list(t.stream_conversation(["hi there", "bye"])) == [
        "hi",
        "there",
        "\n",
        "bye",
        "\n",
    ]


def test_stream_conversation_on_empty_input() -> None:
    assert list(t.stream_conversation([])) == []


def test_take_returns_the_first_n() -> None:
    assert t.take(["a", "b", "c", "d"], 2) == ["a", "b"]


def test_take_does_not_over_consume() -> None:
    # The reason to use islice rather than list(items)[:n]: on an expensive or
    # infinite stream, pulling everything first is fatal.
    seen: list[str] = []
    assert t.take(counting_stream(["a", "b", "c", "d"], seen), 2) == ["a", "b"]
    assert seen == ["a", "b"], "only 2 items should have been pulled"


def test_take_when_n_exceeds_available() -> None:
    assert t.take(["a"], 10) == ["a"]


def test_take_zero() -> None:
    assert t.take(["a", "b"], 0) == []


def test_batch_requests_groups_into_lists() -> None:
    assert list(t.batch_requests(["a", "b", "c", "d"], 2)) == [["a", "b"], ["c", "d"]]


def test_batch_requests_final_batch_is_short() -> None:
    # Not padded. A padded final batch would send empty strings to the provider.
    assert list(t.batch_requests(["a", "b", "c"], 2)) == [["a", "b"], ["c"]]


def test_batch_requests_yields_lists_not_tuples() -> None:
    first = next(iter(t.batch_requests(["a", "b"], 2)))
    assert isinstance(first, list), "itertools.batched yields tuples; convert them"


def test_batch_requests_rejects_a_bad_size_eagerly() -> None:
    # No iteration here. A generator function's body does not run until you
    # iterate it, so validating inside one would let this call succeed silently.
    with pytest.raises(ValueError):
        t.batch_requests(["a", "b"], 0)


def test_batch_requests_stays_lazy() -> None:
    seen: list[str] = []
    batches = t.batch_requests(counting_stream(["a", "b", "c", "d"], seen), 2)
    assert seen == []
    assert next(iter(batches)) == ["a", "b"]
    assert seen == ["a", "b"], "the second batch should not have been built yet"


def test_count_tokens_counts_a_generator() -> None:
    assert t.count_tokens(t.stream_words("one two three")) == 3


def test_count_tokens_on_empty_stream() -> None:
    assert t.count_tokens(iter([])) == 0


def test_collect_and_summarise_returns_both() -> None:
    assert t.collect_and_summarise(t.stream_words("hello world")) == ("hello world", 2)


def test_collect_and_summarise_works_on_a_single_pass_stream() -> None:
    # The exhaustion trap. Iterating the stream twice returns "" and 0 for the
    # second read -- silently, with nothing raised to point at the cause.
    seen: list[str] = []
    text, count = t.collect_and_summarise(counting_stream(["a", "b", "c"], seen))
    assert text == "a b c"
    assert count == 3
    assert seen == ["a", "b", "c"], "the stream should be consumed exactly once"


def test_collect_and_summarise_on_empty_stream() -> None:
    assert t.collect_and_summarise(iter([])) == ("", 0)
