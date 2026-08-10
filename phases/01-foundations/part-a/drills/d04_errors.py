"""Topic 04 — Errors.

Read `lessons/04-errors.md` first.

    uv run pytest phases/01-foundations/part-a/tests/test_04_errors.py
"""

from __future__ import annotations

from collections.abc import Callable


class ExtractionError(Exception):
    """Raised when a model response cannot be parsed into the shape we need.

    Given to you as the example: a custom exception is a class inheriting from
    `Exception`, and the docstring is the entire body. You will define one
    yourself in exercise 4.3.
    """


def parse_temperature(raw: str) -> float:
    """Parse a temperature setting from a string, rejecting out-of-range values.

    Two different failures, two different exception types:
      - text that is not a number at all  -> ValueError
      - a number outside 0.0..2.0         -> ValueError

    Both are ValueError here because in both cases the caller gave a str (right
    type) with unusable content (wrong value). The messages must differ, though;
    the test checks that the out-of-range message mentions the range.

    Args:
        raw: The user-supplied temperature, e.g. "0.7".

    Returns:
        The parsed temperature.

    Raises:
        ValueError: If `raw` is not numeric, or is outside 0.0 to 2.0 inclusive.
    """
    raise NotImplementedError("Exercise 4.1")


def extract_json_object(raw: str) -> dict[str, object]:
    """Parse a JSON object from a model response, chaining any parse failure.

    The Phase 3 pattern in miniature. Use `json.loads`. When it raises
    `json.JSONDecodeError`, re-raise as `ExtractionError` with `from exc` so
    the original cause stays attached to the traceback. Include the first 100
    characters of `raw` in your message, formatted with `!r`.

    A response that parses as valid JSON but is a list or a string — not an
    object — is also an ExtractionError. Models do that more than you would like.

    Args:
        raw: The model's raw text output.

    Returns:
        The parsed JSON object.

    Raises:
        ExtractionError: If `raw` is not valid JSON, or is not a JSON object.
    """
    raise NotImplementedError("Exercise 4.2")


def get_required_field(payload: dict[str, object], field: str) -> object:
    """Read a field that must be present, with a useful error if it is not.

    Define your own exception class named `MissingFieldError` at module level
    (above this function) inheriting from `Exception`, and raise it here. The
    test imports it by name, so spelling matters.

    Chain from the underlying `KeyError` using `from exc` — the test inspects
    `__cause__` to confirm you did.

    Args:
        payload: A parsed API response.
        field: The key that must exist.

    Returns:
        The value at `field`.

    Raises:
        MissingFieldError: If `field` is absent.
    """
    raise NotImplementedError("Exercise 4.3")


def is_retryable(status_code: int) -> bool:
    """Should a request that returned this HTTP status be retried?

    The classification you will reuse against real providers in Phase 2:
      - 429 (rate limited)      -> retry, the limit is temporary
      - 500, 502, 503, 504      -> retry, the provider is having a moment
      - 408 (request timeout)   -> retry
      - anything else, including 400 and 401 -> do not retry

    Retrying a 401 just spends your rate limit re-proving the key is still
    wrong; retrying a 400 sends the same malformed body forever.

    Args:
        status_code: The HTTP status returned.

    Returns:
        True if retrying could plausibly succeed.
    """
    raise NotImplementedError("Exercise 4.4")


def call_with_cleanup(operation: Callable[[], str], cleanup: Callable[[], None]) -> str:
    """Run `operation`, always running `cleanup` afterwards.

    Exercises `finally`. `cleanup` must run whether `operation` returns normally
    or raises — and when it raises, the exception must still propagate to the
    caller rather than being swallowed.

    Args:
        operation: The work to attempt.
        cleanup: Teardown that must not be skipped.

    Returns:
        Whatever `operation` returned.
    """
    raise NotImplementedError("Exercise 4.5")


def first_successful(operations: list[Callable[[], str]]) -> str:
    """Try each operation in order, returning the first result that succeeds.

    Catch only `ValueError` — any other exception type means something you did
    not anticipate went wrong, and swallowing it would hide a real bug. Let
    those propagate.

    Args:
        operations: Callables to try, in preference order.

    Returns:
        The first successful result.

    Raises:
        ExtractionError: If every operation raised ValueError, or the list was
            empty. Message must mention how many were attempted.
    """
    raise NotImplementedError("Exercise 4.6")
