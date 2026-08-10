"""Topic 04 — Errors: reference solutions."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import cast

# Statuses worth retrying: the condition that caused them is expected to pass.
# 4xx codes other than these describe a broken request -- retrying is pure waste.
RETRYABLE_STATUS_CODES = frozenset({408, 429, 500, 502, 503, 504})


class ExtractionError(Exception):
    """Raised when a model response cannot be parsed into the shape we need."""


class MissingFieldError(Exception):
    """Raised when a required field is absent from an API response."""


def parse_temperature(raw: str) -> float:
    """Parse a temperature setting from a string, rejecting out-of-range values."""
    try:
        value = float(raw)
    except ValueError as exc:
        # float() already raises ValueError, but its message ("could not convert
        # string to float: 'hot'") says nothing about temperature. Re-raise with
        # domain context, chained so the original is still visible.
        raise ValueError(f"temperature must be a number, got {raw!r}") from exc

    if not 0.0 <= value <= 2.0:
        raise ValueError(f"temperature must be between 0.0 and 2.0, got {value}")
    return value


def extract_json_object(raw: str) -> dict[str, object]:
    """Parse a JSON object from a model response, chaining any parse failure."""
    try:
        parsed: object = json.loads(raw)
    except json.JSONDecodeError as exc:
        # `from exc` keeps JSONDecodeError's line/column detail attached. Without
        # it you know the JSON was bad but not where, which matters when the
        # model emitted 4KB of almost-valid output.
        raise ExtractionError(f"model returned invalid JSON: {raw[:100]!r}") from exc

    # Valid JSON is not necessarily a JSON *object* -- "[1, 2]" and '"hi"' both
    # parse fine. Checking here means callers can trust the return type.
    if not isinstance(parsed, dict):
        raise ExtractionError(f"expected a JSON object, got {type(parsed).__name__}")

    # isinstance can only narrow to dict[Unknown, Unknown] -- it checks the
    # container, not its contents. JSON object keys are always strings, so this
    # cast records what the format already guarantees. Narrow and justified, as
    # opposed to typing the whole function `-> Any`, which would switch off
    # checking for every caller downstream.
    return cast("dict[str, object]", parsed)


def get_required_field(payload: dict[str, object], field: str) -> object:
    """Read a field that must be present, with a useful error if it is not."""
    try:
        return payload[field]
    except KeyError as exc:
        # Listing the keys that ARE present turns "KeyError: 'usage'" into an
        # error you can act on without reaching for a debugger.
        available = ", ".join(sorted(payload)) or "<none>"
        raise MissingFieldError(
            f"required field {field!r} missing; payload has: {available}"
        ) from exc


def is_retryable(status_code: int) -> bool:
    """Should a request that returned this HTTP status be retried?"""
    return status_code in RETRYABLE_STATUS_CODES


def call_with_cleanup(operation: Callable[[], str], cleanup: Callable[[], None]) -> str:
    """Run `operation`, always running `cleanup` afterwards."""
    try:
        return operation()
    finally:
        # No `except` clause at all: this function does not know how to handle
        # any failure, so it does not catch one. `finally` still runs on the way
        # out, and the exception continues to the caller untouched.
        cleanup()


def first_successful(operations: list[Callable[[], str]]) -> str:
    """Try each operation in order, returning the first result that succeeds."""
    for operation in operations:
        try:
            return operation()
        except ValueError:
            # Deliberately narrow. A TypeError here would mean a bug in the
            # operation itself, and hiding it would cost hours later.
            continue
    raise ExtractionError(f"all {len(operations)} operations failed")
