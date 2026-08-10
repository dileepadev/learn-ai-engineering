"""Topic 03 — Comprehensions & iteration: reference solutions."""

from __future__ import annotations

Message = dict[str, str]


def user_content_lengths(messages: list[Message]) -> list[int]:
    """Character length of every user message, in order."""
    return [len(m["content"]) for m in messages if m["role"] == "user"]


def index_by_id(records: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    """Build an ID -> record lookup table from a list of records."""
    # Later keys overwrite earlier ones, so a duplicate ID keeps the last record.
    # That is dict semantics, and pretending otherwise would hide real duplicates.
    return {record["id"]: record for record in records}


def numbered_chunks(chunks: list[str]) -> list[str]:
    """Prefix each chunk with a 1-based position label."""
    # `start=1` beats writing `i + 1` inside the f-string: the intent lives in
    # one place instead of being re-derived at every use.
    return [f"{i}. {chunk}" for i, chunk in enumerate(chunks, start=1)]


def pair_chunks_with_embeddings(
    chunks: list[str], embeddings: list[list[float]]
) -> list[tuple[str, list[float]]]:
    """Pair each chunk with its embedding vector."""
    # strict=True turns a silent truncation into a loud ValueError. Without it a
    # short embeddings list would misalign every remaining pair, and retrieval
    # would return confidently wrong results with nothing in the logs.
    return list(zip(chunks, embeddings, strict=True))


def top_k_by_score(hits: list[tuple[str, float]], k: int) -> list[tuple[str, float]]:
    """Return the `k` highest-scoring hits, best first."""
    # Negating the score sorts it descending while the title stays ascending --
    # one `sorted` call, two directions. reverse=True would flip both.
    # `sorted` returns a new list, so the caller's ordering is untouched.
    return sorted(hits, key=lambda hit: (-hit[1], hit[0]))[:k]


def unique_roles(messages: list[Message]) -> set[str]:
    """The distinct roles present in a conversation."""
    return {m["role"] for m in messages}
