"""Tests for topic 00 — Python basics."""

from __future__ import annotations

from conftest import load_topic

t = load_topic("00_python_basics")


def test_estimate_tokens_uses_four_characters_per_token() -> None:
    assert t.estimate_tokens("12345678") == 2
    assert t.estimate_tokens("1234567890") == 2


def test_estimate_tokens_returns_an_int_not_a_float() -> None:
    # `len(text) / 4` would give 2.0 here, which compares equal to 2 but is the
    # wrong type -- and a float max_tokens is a 400 from a real provider.
    result = t.estimate_tokens("12345678")
    assert isinstance(result, int), "use // (floor division), not /"


def test_estimate_tokens_on_short_and_empty_input() -> None:
    assert t.estimate_tokens("") == 0
    assert t.estimate_tokens("abc") == 0


def test_classify_length_buckets_correctly() -> None:
    assert t.classify_length(5000) == "long"
    assert t.classify_length(1200) == "medium"
    assert t.classify_length(100) == "short"


def test_classify_length_at_the_boundaries() -> None:
    # "more than", so the thresholds themselves fall into the lower bucket.
    assert t.classify_length(2001) == "long"
    assert t.classify_length(2000) == "medium"
    assert t.classify_length(501) == "medium"
    assert t.classify_length(500) == "short"
    assert t.classify_length(0) == "short"


def test_clamp_temperature_passes_valid_values_through() -> None:
    assert t.clamp_temperature(0.7) == 0.7
    assert t.clamp_temperature(0.0) == 0.0
    assert t.clamp_temperature(2.0) == 2.0


def test_clamp_temperature_clamps_both_ends() -> None:
    assert t.clamp_temperature(-1.5) == 0.0
    assert t.clamp_temperature(9.9) == 2.0


def test_truncate_leaves_short_text_alone() -> None:
    assert t.truncate("hello", 10) == "hello"
    assert t.truncate("hello", 5) == "hello"


def test_truncate_cuts_and_marks_long_text() -> None:
    assert t.truncate("hello world", 5) == "hello..."


def test_truncate_on_empty_text() -> None:
    assert t.truncate("", 5) == ""


def test_retry_delays_doubles_until_the_bound() -> None:
    assert t.retry_delays(60) == [1, 2, 4, 8, 16, 32]


def test_retry_delays_bound_is_exclusive() -> None:
    # 8 is not < 8, so the schedule stops before it.
    assert t.retry_delays(8) == [1, 2, 4]


def test_retry_delays_with_no_room() -> None:
    assert t.retry_delays(1) == []
    assert t.retry_delays(0) == []


def test_sum_valid_counts_skips_negatives() -> None:
    assert t.sum_valid_counts([10, -1, 20, -99, 5]) == 35


def test_sum_valid_counts_includes_zero() -> None:
    # 0 is a legitimate token count, not junk. `if not count: continue` would
    # wrongly skip it -- this is the truthiness trap, one topic early.
    assert t.sum_valid_counts([0, 10]) == 10
    assert t.sum_valid_counts([0]) == 0


def test_sum_valid_counts_on_empty_input() -> None:
    assert t.sum_valid_counts([]) == 0


def test_count_until_blank_stops_at_the_first_blank() -> None:
    assert t.count_until_blank(["a", "b", "", "c", "d"]) == 2


def test_count_until_blank_treats_whitespace_as_blank() -> None:
    assert t.count_until_blank(["a", "   ", "c"]) == 1


def test_count_until_blank_with_no_blank_line() -> None:
    assert t.count_until_blank(["a", "b", "c"]) == 3


def test_count_until_blank_when_the_first_line_is_blank() -> None:
    assert t.count_until_blank(["", "a"]) == 0
    assert t.count_until_blank([]) == 0


def test_normalize_model_name_trims_lowercases_and_hyphenates() -> None:
    assert t.normalize_model_name("  Claude Sonnet 5  ") == "claude-sonnet-5"


def test_normalize_model_name_leaves_clean_names_alone() -> None:
    assert t.normalize_model_name("claude-opus-5") == "claude-opus-5"


def test_normalize_model_name_strips_before_replacing() -> None:
    # Replacing spaces first would turn the leading blanks into hyphens.
    assert t.normalize_model_name("  Opus  ") == "opus"


def test_format_percent_formats_to_one_decimal() -> None:
    assert t.format_percent(43, 50) == "86.0%"
    assert t.format_percent(1, 3) == "33.3%"


def test_format_percent_handles_the_extremes() -> None:
    assert t.format_percent(0, 10) == "0.0%"
    assert t.format_percent(10, 10) == "100.0%"


def test_format_percent_guards_division_by_zero() -> None:
    # The first run of any cache-hit or pass-rate counter hits this.
    assert t.format_percent(0, 0) == "n/a"
