"""Topic 00 — Python basics: reference solutions."""

from __future__ import annotations

# ~4 characters per token is the usual English rule of thumb. Named rather than
# inlined so the assumption is visible and changeable in one place.
CHARS_PER_TOKEN = 4


def estimate_tokens(text: str) -> int:
    """Roughly estimate how many tokens `text` will cost."""
    # Floor division, not `/`. True division returns a float even when it
    # divides evenly, and this function's contract promises an int.
    return len(text) // CHARS_PER_TOKEN


def classify_length(word_count: int) -> str:
    """Bucket a document by length."""
    # Widest threshold first. Reversed, `> 500` would catch every long document
    # too, because the first matching branch wins and the rest never run.
    if word_count > 2000:
        return "long"
    if word_count > 500:
        return "medium"
    return "short"


def clamp_temperature(value: float) -> float:
    """Force a temperature into the valid 0.0 to 2.0 range."""
    # `min(2.0, max(0.0, value))` is the one-liner. The explicit form is kept
    # because reading it requires no reconstruction of which bound is which.
    if value < 0.0:
        return 0.0
    if value > 2.0:
        return 2.0
    return value


def truncate(text: str, max_chars: int) -> str:
    """Shorten `text` to at most `max_chars` characters, marking the cut."""
    if len(text) <= max_chars:
        return text
    # Slicing is start-inclusive, stop-exclusive, so [:max_chars] is exactly
    # max_chars characters -- the same rule as range().
    return text[:max_chars] + "..."


def retry_delays(max_delay: int) -> list[int]:
    """Build an exponential-backoff schedule: 1, 2, 4, 8, ... seconds."""
    delays: list[int] = []
    delay = 1

    while delay < max_delay:
        delays.append(delay)
        # This line is what makes the loop terminate. Without it the condition
        # never changes and the loop runs forever -- the whole failure mode of
        # `while`, in one missing statement.
        delay = delay * 2

    return delays


def sum_valid_counts(counts: list[int]) -> int:
    """Total the token counts, skipping malformed negative entries."""
    total = 0

    for count in counts:
        # `continue` says "this item does not qualify" without pushing the real
        # work one indent deeper inside an `if count >= 0:` block.
        if count < 0:
            continue
        total += count

    return total


def count_until_blank(lines: list[str]) -> int:
    """Count lines up to the first blank one, not including it."""
    counted = 0

    for line in lines:
        # .strip() removes whitespace, so a line of spaces is falsy and counts
        # as blank -- which is what a human means by "blank line".
        if not line.strip():
            break
        counted += 1

    return counted


def normalize_model_name(raw: str) -> str:
    """Clean up a user-typed model name."""
    # Chained because each method returns a NEW string; calling them without
    # using the result would leave `raw` untouched. strip() first, so leading
    # spaces never become leading hyphens.
    return raw.strip().lower().replace(" ", "-")


def format_percent(part: int, whole: int) -> str:
    """Format `part` of `whole` as a percentage with one decimal place."""
    # The guard, not a try/except: zero here is an ordinary expected state (no
    # requests yet), not an error worth raising and catching.
    if whole == 0:
        return "n/a"

    # `:.1%` multiplies by 100 and appends the sign, so the ratio is passed
    # as-is rather than pre-multiplied.
    return f"{part / whole:.1%}"
