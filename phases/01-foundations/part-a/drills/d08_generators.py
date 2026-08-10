"""Topic 08 — Generators & iterators.

Read `lessons/08-generators.md` first.

Several tests here check *laziness*, not just values: they assert that nothing
has been computed until the caller asks for it. Returning a list will fail those
tests even when every value is correct.

    uv run pytest phases/01-foundations/part-a/tests/test_08_generators.py
"""

from __future__ import annotations

from collections.abc import Iterable, Iterator


def stream_words(text: str) -> Iterator[str]:
    """Yield the whitespace-separated words of `text`, one at a time.

    The simplest possible token stream. A test calls this and then asserts that
    nothing has run yet — so the function body must not execute until the first
    `next()`. Any function containing `yield` behaves that way automatically.

    Args:
        text: Text to split.

    Yields:
        Each word in order.
    """
    raise NotImplementedError("Exercise 8.1")


def stream_with_done(chunks: Iterable[str]) -> Iterator[str]:
    """Yield every chunk, then a final "[DONE]" sentinel.

    This is the shape of a real SSE stream — providers terminate with an
    explicit sentinel so the consumer can tell "finished" from "connection
    dropped". You will emit exactly this in the `mockstream` project.

    Args:
        chunks: The content chunks to relay.

    Yields:
        Each chunk in order, then the literal string "[DONE]".
    """
    raise NotImplementedError("Exercise 8.2")


def stream_conversation(messages: Iterable[str]) -> Iterator[str]:
    """Yield the words of every message, with "\\n" between messages.

    Use `yield from` to delegate to `stream_words` rather than writing a nested
    loop. The newline goes *after* each message, including the last.

    Args:
        messages: Message texts.

    Yields:
        Words and newline separators, in order.
    """
    raise NotImplementedError("Exercise 8.3")


def take(items: Iterable[str], n: int) -> list[str]:
    """Materialise the first `n` items, without consuming any more than that.

    A generator has no slicing syntax. `list(items)[:n]` would work but pulls
    everything first — fatal on an infinite or expensive stream. Use the
    itertools function named in the lesson.

    Args:
        items: Any iterable, possibly infinite.
        n: How many items to take.

    Returns:
        Up to `n` items as a list.
    """
    raise NotImplementedError("Exercise 8.4")


def batch_requests(items: Iterable[str], size: int) -> Iterator[list[str]]:
    """Group items into lists of at most `size`, lazily.

    Batching is how you stay inside a provider's per-request limits — the
    Anthropic Batch API and every embedding endpoint cap batch size. The final
    batch is short unless the count divides evenly; do not pad it.

    `itertools.batched` yields tuples; this function must yield lists.

    One subtlety, and it is the lesson's third "cost" made concrete: the
    ValueError below must fire when this function is CALLED, not when the
    result is first iterated. A function whose body contains `yield` runs none
    of its body at call time — so a plain `if size < 1: raise` at the top of a
    generator function never fires until someone iterates. Getting the eager
    behaviour means this function must not itself contain `yield`: validate,
    then return a nested generator that does the yielding.

    Args:
        items: Items to batch.
        size: Maximum batch size. Must be at least 1.

    Yields:
        Lists of at most `size` items.

    Raises:
        ValueError: If `size` is less than 1 — raised on call, not on iteration.
    """
    raise NotImplementedError("Exercise 8.5")


def count_tokens(stream: Iterable[str]) -> int:
    """Count the items in a stream without materialising it.

    `len()` does not work on a generator — there is no count without consuming
    it. Consume it, counting as you go, holding one item at a time.

    Args:
        stream: Any iterable.

    Returns:
        How many items it produced.
    """
    raise NotImplementedError("Exercise 8.6")


def collect_and_summarise(stream: Iterable[str]) -> tuple[str, int]:
    """Return the joined text AND the word count from a single pass.

    The exhaustion trap, made concrete. This will NOT work:

        text = " ".join(stream)
        count = count_tokens(stream)   # 0 -- the stream is already spent

    A generator gives you one pass. Materialise it once, then use that.

    Args:
        stream: Words from a stream.

    Returns:
        A (joined text, word count) pair. Words are joined with single spaces.
    """
    raise NotImplementedError("Exercise 8.7")
