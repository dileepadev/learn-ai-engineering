"""Topic 08 — Generators & iterators: reference solutions."""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from itertools import batched, islice


def stream_words(text: str) -> Iterator[str]:
    """Yield the whitespace-separated words of `text`, one at a time."""
    # The presence of `yield` anywhere in the body makes calling this function
    # produce a generator and run none of this code. That is why the laziness
    # test passes without any extra effort.
    #
    # The suppression below is deliberate: ruff correctly points out that this
    # loop is `yield from text.split()`. Kept explicit because this is the first
    # generator in the topic, and `yield from` is not introduced until 8.3.
    for word in text.split():  # noqa: UP028
        yield word


def stream_with_done(chunks: Iterable[str]) -> Iterator[str]:
    """Yield every chunk, then a final "[DONE]" sentinel."""
    yield from chunks
    # The sentinel is what lets a consumer distinguish a completed stream from a
    # dropped connection -- without it, both just stop producing bytes.
    yield "[DONE]"


def stream_conversation(messages: Iterable[str]) -> Iterator[str]:
    """Yield the words of every message, with "\\n" between messages."""
    for message in messages:
        # `yield from` delegates: each word stream_words produces is passed
        # straight through, still one at a time, nothing buffered in between.
        yield from stream_words(message)
        yield "\n"


def take(items: Iterable[str], n: int) -> list[str]:
    """Materialise the first `n` items, without consuming any more than that."""
    # islice pulls exactly n items and stops. `list(items)[:n]` would drain the
    # whole iterable first -- unbounded memory, and non-terminating if infinite.
    return list(islice(items, n))


def batch_requests(items: Iterable[str], size: int) -> Iterator[list[str]]:
    """Group items into lists of at most `size`, lazily."""
    if size < 1:
        # batched() raises its own ValueError, but only once iteration starts --
        # and a generator body does not run until then. Checking here would be
        # too late for the same reason, which is why this function delegates
        # the actual yielding to a nested generator below.
        raise ValueError(f"batch size must be at least 1, got {size}")

    def batches() -> Iterator[list[str]]:
        for batch in batched(items, size):
            yield list(batch)

    return batches()


def count_tokens(stream: Iterable[str]) -> int:
    """Count the items in a stream without materialising it."""
    # `sum(1 for _ in stream)` holds one item at a time; len(list(stream))
    # would build the entire list purely to ask how long it is.
    return sum(1 for _ in stream)


def collect_and_summarise(stream: Iterable[str]) -> tuple[str, int]:
    """Return the joined text AND the word count from a single pass."""
    # One pass, materialised once. Iterating `stream` twice would give an empty
    # result the second time -- silently, with no exception to point at.
    words = list(stream)
    return " ".join(words), len(words)
