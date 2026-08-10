"""Topic 00 — Python basics.

Read `lessons/00-python-basics.md` first. These are deliberately small: the
point is fluency with variables, numbers, strings, conditionals, and loops, not
cleverness.

    uv run pytest phases/01-foundations/part-a/tests/test_00_python_basics.py
"""

from __future__ import annotations


def estimate_tokens(text: str) -> int:
    """Roughly estimate how many tokens `text` will cost.

    The standard back-of-envelope rule for English is ~4 characters per token.
    Return a whole number of tokens, rounded DOWN.

    The trap: `len(text) / 4` gives a float (`10 / 5` is `2.0`, not `2`), and
    this function promises an int. The lesson names the operator that stays an
    int.

    Args:
        text: The text to estimate.

    Returns:
        len(text) // 4 — so "" is 0 and "abc" is 0.
    """
    raise NotImplementedError("Exercise 0.1")


def classify_length(word_count: int) -> str:
    """Bucket a document by length.

        more than 2000 words -> "long"
        more than 500        -> "medium"
        anything else        -> "short"

    An if/elif/else chain. Order matters: the first matching branch wins, so
    check the widest threshold first or every long document reads as medium.

    Args:
        word_count: Words in the document.

    Returns:
        "long", "medium", or "short".
    """
    raise NotImplementedError("Exercise 0.2")


def clamp_temperature(value: float) -> float:
    """Force a temperature into the valid 0.0 to 2.0 range.

    Below 0.0 becomes 0.0; above 2.0 becomes 2.0; anything in between is
    returned unchanged. Providers reject out-of-range values, so clamping is
    kinder than erroring on a config typo.

    Args:
        value: The requested temperature.

    Returns:
        The value, confined to 0.0 to 2.0 inclusive.
    """
    raise NotImplementedError("Exercise 0.3")


def truncate(text: str, max_chars: int) -> str:
    """Shorten `text` to at most `max_chars` characters, marking the cut.

    If `text` already fits, return it unchanged. Otherwise return the first
    `max_chars` characters with "..." appended.

    Note that the result is then longer than `max_chars` — that is intended
    here, and worth noticing: "truncate to N" is ambiguous in real APIs, and
    guessing wrong is a classic off-by-three.

    Args:
        text: The text to shorten.
        max_chars: How many characters to keep.

    Returns:
        The original text, or the first `max_chars` characters plus "...".
    """
    raise NotImplementedError("Exercise 0.4")


def retry_delays(max_delay: int) -> list[int]:
    """Build an exponential-backoff schedule: 1, 2, 4, 8, ... seconds.

    A `while` loop. Start at 1 and double each time, collecting every delay
    that is strictly less than `max_delay`. Stop there.

    For max_delay=60 that is [1, 2, 4, 8, 16, 32]. For max_delay=1 it is [].

    You will write this exact schedule against a rate-limited provider in
    Phase 2. Make sure something in the loop changes the delay — a `while` that
    never updates its condition runs forever.

    Args:
        max_delay: The exclusive upper bound, in seconds.

    Returns:
        The delays, ascending.
    """
    raise NotImplementedError("Exercise 0.5")


def sum_valid_counts(counts: list[int]) -> int:
    """Total the token counts, skipping malformed negative entries.

    Exercises `continue`: when a count is negative, skip to the next item
    rather than nesting the real work inside an `if`. Zero is a legitimate
    count and must be included.

    Args:
        counts: Token counts, possibly containing negative junk.

    Returns:
        The sum of the non-negative entries. Empty input totals 0.
    """
    raise NotImplementedError("Exercise 0.6")


def count_until_blank(lines: list[str]) -> int:
    """Count lines up to the first blank one, not including it.

    Exercises `break`. A line counts as blank if it is empty or only
    whitespace. If no line is blank, count them all.

    Args:
        lines: Lines of text.

    Returns:
        How many lines appear before the first blank line.
    """
    raise NotImplementedError("Exercise 0.7")


def normalize_model_name(raw: str) -> str:
    """Clean up a user-typed model name.

    Trim surrounding whitespace, lowercase it, and replace spaces with hyphens:

        "  Claude Sonnet 5  "  ->  "claude-sonnet-5"

    Remember that string methods return a NEW string — calling `.strip()`
    without assigning the result does nothing.

    Args:
        raw: The name as typed.

    Returns:
        The normalized name.
    """
    raise NotImplementedError("Exercise 0.8")


def format_percent(part: int, whole: int) -> str:
    """Format `part` of `whole` as a percentage with one decimal place.

        format_percent(43, 50)  ->  "86.0%"
        format_percent(0, 0)    ->  "n/a"

    Guard the division: `whole` of 0 must return "n/a" rather than raising
    ZeroDivisionError. Cache-hit rates and eval pass rates both hit this on
    the first run, when nothing has happened yet.

    Args:
        part: The numerator.
        whole: The denominator.

    Returns:
        A percentage like "86.0%", or "n/a" when `whole` is 0.
    """
    raise NotImplementedError("Exercise 0.9")
