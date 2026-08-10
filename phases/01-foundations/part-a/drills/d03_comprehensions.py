"""Topic 03 — Comprehensions & iteration.

Read `lessons/03-comprehensions.md` first.

    uv run pytest phases/01-foundations/part-a/tests/test_03_comprehensions.py
"""

from __future__ import annotations

Message = dict[str, str]


def user_content_lengths(messages: list[Message]) -> list[int]:
    """Character length of every user message, in order.

    Map plus filter — the comprehension's home ground. Messages from other
    roles are skipped entirely, not zeroed.

    Args:
        messages: Chat messages with "role" and "content" keys.

    Returns:
        Lengths of the "user" messages only.
    """
    raise NotImplementedError("Exercise 3.1")


def index_by_id(records: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    """Build an ID -> record lookup table from a list of records.

    A dict comprehension. This turns an O(n) scan into an O(1) lookup, which is
    why you will do it constantly once corpora get large. On duplicate IDs the
    last record wins — that is what dict construction does, and the test
    confirms you have not worked around it.

    Args:
        records: Records each containing an "id" key.

    Returns:
        Mapping from each record's "id" to the record itself.
    """
    raise NotImplementedError("Exercise 3.2")


def numbered_chunks(chunks: list[str]) -> list[str]:
    """Prefix each chunk with a 1-based position label.

    For ["alpha", "beta"] the result is ["1. alpha", "2. beta"].
    Use `enumerate`, and note it takes a `start` argument.

    Args:
        chunks: Text chunks in order.

    Returns:
        Each chunk prefixed with "<n>. ".
    """
    raise NotImplementedError("Exercise 3.3")


def pair_chunks_with_embeddings(
    chunks: list[str], embeddings: list[list[float]]
) -> list[tuple[str, list[float]]]:
    """Pair each chunk with its embedding vector.

    This is the Phase 4 operation the lesson warns about. The two lists MUST be
    the same length; if they are not, a silent truncation attaches every later
    embedding to the wrong text. Make the mismatch raise ValueError instead —
    `zip` has an argument for exactly this.

    Args:
        chunks: Text chunks.
        embeddings: One vector per chunk, same order.

    Returns:
        (chunk, embedding) pairs.

    Raises:
        ValueError: If the two inputs have different lengths.
    """
    raise NotImplementedError("Exercise 3.4")


def top_k_by_score(hits: list[tuple[str, float]], k: int) -> list[tuple[str, float]]:
    """Return the `k` highest-scoring hits, best first.

    Each hit is a `(title, score)` pair — a tuple used as a fixed-shape record,
    exactly as topic 01 described. Sort by score descending; break ties by
    title ascending (A before Z). One `sorted` call, two directions: that is
    the tuple-key trick from the lesson.

    Do not mutate the input list; the test checks its order afterwards.

    Args:
        hits: (title, score) pairs.
        k: How many to return.

    Returns:
        At most `k` hits, highest score first.
    """
    raise NotImplementedError("Exercise 3.5")


def unique_roles(messages: list[Message]) -> set[str]:
    """The distinct roles present in a conversation.

    A set comprehension — one line.

    Args:
        messages: Chat messages with a "role" key.

    Returns:
        Every role that appears, without duplicates.
    """
    raise NotImplementedError("Exercise 3.6")
