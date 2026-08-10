"""Tests for topic 04 — Errors."""

from __future__ import annotations

import json
import re

import pytest
from conftest import load_topic

t = load_topic("04_errors")


def test_parse_temperature_accepts_valid_values() -> None:
    assert t.parse_temperature("0.7") == 0.7
    assert t.parse_temperature("0") == 0.0
    assert t.parse_temperature("2") == 2.0


def test_parse_temperature_rejects_non_numeric() -> None:
    with pytest.raises(ValueError):
        t.parse_temperature("hot")


def test_parse_temperature_rejects_out_of_range() -> None:
    # `match=` is a regex, so the dots in "0.0" would otherwise match any
    # character. re.escape says we mean them literally.
    expected = re.escape("between 0.0 and 2.0")
    with pytest.raises(ValueError, match=expected):
        t.parse_temperature("3.5")
    with pytest.raises(ValueError, match=expected):
        t.parse_temperature("-1")


def test_extract_json_object_parses_an_object() -> None:
    assert t.extract_json_object('{"role": "user"}') == {"role": "user"}


def test_extract_json_object_raises_extraction_error_on_bad_json() -> None:
    with pytest.raises(t.ExtractionError):
        t.extract_json_object("Sure! Here you go: {not json")


def test_extract_json_object_chains_the_original_cause() -> None:
    # `from exc` is what puts JSONDecodeError in __cause__. Without it, __cause__
    # is None and the traceback loses the line/column of the actual syntax error.
    with pytest.raises(t.ExtractionError) as info:
        t.extract_json_object("{broken")
    assert isinstance(info.value.__cause__, json.JSONDecodeError)


def test_extract_json_object_rejects_valid_json_that_is_not_an_object() -> None:
    # Models return bare lists and bare strings more often than you would like.
    with pytest.raises(t.ExtractionError):
        t.extract_json_object("[1, 2, 3]")
    with pytest.raises(t.ExtractionError):
        t.extract_json_object('"just a string"')


def test_get_required_field_returns_present_values() -> None:
    assert t.get_required_field({"usage": {"input_tokens": 10}}, "usage") == {"input_tokens": 10}


def test_get_required_field_raises_missing_field_error() -> None:
    with pytest.raises(t.MissingFieldError):
        t.get_required_field({"id": "msg_1"}, "usage")


def test_get_required_field_chains_from_the_key_error() -> None:
    with pytest.raises(t.MissingFieldError) as info:
        t.get_required_field({"id": "msg_1"}, "usage")
    assert isinstance(info.value.__cause__, KeyError)


def test_is_retryable_retries_transient_failures() -> None:
    for status in (408, 429, 500, 502, 503, 504):
        assert t.is_retryable(status) is True, f"{status} should be retryable"


def test_is_retryable_gives_up_on_client_errors() -> None:
    # Retrying a 401 spends your rate limit re-proving the key is still wrong.
    for status in (200, 201, 400, 401, 403, 404, 422):
        assert t.is_retryable(status) is False, f"{status} should not be retryable"


def test_call_with_cleanup_returns_the_result_and_cleans_up() -> None:
    calls: list[str] = []

    def operation() -> str:
        calls.append("operation")
        return "done"

    def cleanup() -> None:
        calls.append("cleanup")

    assert t.call_with_cleanup(operation, cleanup) == "done"
    assert calls == ["operation", "cleanup"]


def test_call_with_cleanup_runs_cleanup_even_when_the_operation_raises() -> None:
    calls: list[str] = []

    def operation() -> str:
        raise RuntimeError("boom")

    def cleanup() -> None:
        calls.append("cleanup")

    # The exception must still reach the caller -- `finally` cleans up, it does
    # not swallow. A bare `except` here would break both assertions.
    with pytest.raises(RuntimeError, match="boom"):
        t.call_with_cleanup(operation, cleanup)
    assert calls == ["cleanup"]


def test_first_successful_returns_the_first_result() -> None:
    def fails() -> str:
        raise ValueError("nope")

    def works() -> str:
        return "got it"

    assert t.first_successful([fails, works]) == "got it"


def test_first_successful_stops_at_the_first_success() -> None:
    calls: list[str] = []

    def first() -> str:
        calls.append("first")
        return "a"

    def second() -> str:
        calls.append("second")
        return "b"

    assert t.first_successful([first, second]) == "a"
    assert calls == ["first"], "later operations should not run once one succeeds"


def test_first_successful_raises_when_everything_fails() -> None:
    def fails() -> str:
        raise ValueError("nope")

    with pytest.raises(t.ExtractionError, match="2"):
        t.first_successful([fails, fails])


def test_first_successful_does_not_swallow_unexpected_errors() -> None:
    # Only ValueError means "try the next one". A TypeError is a bug in the
    # operation, and hiding it behind a fallback costs hours of debugging.
    def buggy() -> str:
        raise TypeError("this is a real bug")

    def works() -> str:
        return "unreachable"

    with pytest.raises(TypeError):
        t.first_successful([buggy, works])


def test_first_successful_on_empty_list() -> None:
    with pytest.raises(t.ExtractionError):
        t.first_successful([])
