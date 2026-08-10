"""Tests for topic 03 — Comprehensions & iteration."""

from __future__ import annotations

import pytest
from conftest import load_topic

t = load_topic("03_comprehensions")


def test_user_content_lengths_filters_by_role() -> None:
    messages = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "a much longer reply"},
        {"role": "user", "content": "ok"},
    ]
    # Assistant messages are skipped entirely, not included as 0.
    assert t.user_content_lengths(messages) == [5, 2]


def test_user_content_lengths_with_no_user_messages() -> None:
    assert t.user_content_lengths([{"role": "system", "content": "be nice"}]) == []


def test_index_by_id_builds_a_lookup() -> None:
    records = [{"id": "a", "title": "Alpha"}, {"id": "b", "title": "Beta"}]
    assert t.index_by_id(records) == {
        "a": {"id": "a", "title": "Alpha"},
        "b": {"id": "b", "title": "Beta"},
    }


def test_index_by_id_last_duplicate_wins() -> None:
    records = [{"id": "a", "title": "First"}, {"id": "a", "title": "Second"}]
    assert t.index_by_id(records) == {"a": {"id": "a", "title": "Second"}}


def test_numbered_chunks_uses_one_based_numbering() -> None:
    assert t.numbered_chunks(["alpha", "beta", "gamma"]) == ["1. alpha", "2. beta", "3. gamma"]


def test_numbered_chunks_on_empty_input() -> None:
    assert t.numbered_chunks([]) == []


def test_pair_chunks_with_embeddings_aligns_them() -> None:
    chunks = ["first", "second"]
    embeddings = [[0.1, 0.2], [0.3, 0.4]]
    assert t.pair_chunks_with_embeddings(chunks, embeddings) == [
        ("first", [0.1, 0.2]),
        ("second", [0.3, 0.4]),
    ]


def test_pair_chunks_with_embeddings_rejects_length_mismatch() -> None:
    # Plain zip() would return one pair and silently drop "second" -- and in a
    # real pipeline every later chunk would be paired with a stranger's vector.
    chunks = ["first", "second"]
    embeddings = [[0.1, 0.2]]
    with pytest.raises(ValueError):
        t.pair_chunks_with_embeddings(chunks, embeddings)


def test_top_k_by_score_returns_best_first() -> None:
    hits = [("low", 0.1), ("high", 0.9), ("mid", 0.5)]
    assert t.top_k_by_score(hits, 2) == [("high", 0.9), ("mid", 0.5)]


def test_top_k_by_score_breaks_ties_by_title_ascending() -> None:
    hits = [("zebra", 0.5), ("apple", 0.5)]
    assert t.top_k_by_score(hits, 2) == [("apple", 0.5), ("zebra", 0.5)]


def test_top_k_by_score_does_not_mutate_input() -> None:
    hits = [("low", 0.1), ("high", 0.9)]
    t.top_k_by_score(hits, 2)
    assert hits == [("low", 0.1), ("high", 0.9)], "use sorted(), not list.sort()"


def test_top_k_by_score_when_k_exceeds_length() -> None:
    hits = [("only", 0.5)]
    assert t.top_k_by_score(hits, 10) == [("only", 0.5)]


def test_unique_roles_deduplicates() -> None:
    messages = [
        {"role": "user", "content": "a"},
        {"role": "assistant", "content": "b"},
        {"role": "user", "content": "c"},
    ]
    assert t.unique_roles(messages) == {"user", "assistant"}


def test_unique_roles_on_empty_input() -> None:
    assert t.unique_roles([]) == set()
