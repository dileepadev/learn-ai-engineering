"""Tests for topic 05 — Files & data.

`tmp_path` is a built-in pytest fixture: each test that names it as a parameter
gets a fresh, empty directory, cleaned up afterwards. Never write test files
next to your source.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from conftest import load_topic

t = load_topic("05_files_and_json")


def test_read_json_object_parses_a_file(tmp_path: Path) -> None:
    path = tmp_path / "payload.json"
    path.write_text('{"role": "user", "n": 3}', encoding="utf-8")
    assert t.read_json_object(path) == {"role": "user", "n": 3}


def test_read_json_object_handles_non_ascii(tmp_path: Path) -> None:
    path = tmp_path / "payload.json"
    path.write_text('{"city": "Kandy — Sri Lanka"}', encoding="utf-8")
    assert t.read_json_object(path) == {"city": "Kandy — Sri Lanka"}


def test_read_json_object_propagates_missing_file(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        t.read_json_object(tmp_path / "nope.json")


def test_read_json_object_rejects_malformed_json(tmp_path: Path) -> None:
    path = tmp_path / "bad.json"
    path.write_text("{not json", encoding="utf-8")
    with pytest.raises(t.DataFileError):
        t.read_json_object(path)


def test_read_json_object_rejects_a_top_level_array(tmp_path: Path) -> None:
    path = tmp_path / "array.json"
    path.write_text("[1, 2, 3]", encoding="utf-8")
    with pytest.raises(t.DataFileError):
        t.read_json_object(path)


def test_write_json_object_creates_missing_directories(tmp_path: Path) -> None:
    path = tmp_path / "out" / "nested" / "data.json"
    t.write_json_object(path, {"a": 1})
    assert json.loads(path.read_text(encoding="utf-8")) == {"a": 1}


def test_write_json_object_is_idempotent(tmp_path: Path) -> None:
    path = tmp_path / "out" / "data.json"
    t.write_json_object(path, {"a": 1})
    # Without exist_ok=True on the mkdir, this second call raises FileExistsError.
    t.write_json_object(path, {"a": 2})
    assert json.loads(path.read_text(encoding="utf-8")) == {"a": 2}


def test_write_json_object_output_is_stable_and_readable(tmp_path: Path) -> None:
    path = tmp_path / "data.json"
    t.write_json_object(path, {"zebra": 1, "apple": 2})
    text = path.read_text(encoding="utf-8")
    assert "  " in text, "use indent=2"
    assert text.index('"apple"') < text.index('"zebra"'), "use sort_keys=True"


def test_write_json_object_keeps_non_ascii_literal(tmp_path: Path) -> None:
    path = tmp_path / "data.json"
    t.write_json_object(path, {"city": "Kandy"})
    text = path.read_text(encoding="utf-8")
    assert "Kandy" in text
    assert "\\u" not in text, "use ensure_ascii=False"


def test_load_jsonl_reads_one_object_per_line(tmp_path: Path) -> None:
    path = tmp_path / "evals.jsonl"
    path.write_text('{"id": "1"}\n{"id": "2"}\n', encoding="utf-8")
    assert t.load_jsonl(path) == [{"id": "1"}, {"id": "2"}]


def test_load_jsonl_skips_blank_lines(tmp_path: Path) -> None:
    path = tmp_path / "evals.jsonl"
    path.write_text('{"id": "1"}\n\n   \n{"id": "2"}\n', encoding="utf-8")
    assert t.load_jsonl(path) == [{"id": "1"}, {"id": "2"}]


def test_load_jsonl_reports_the_offending_line_number(tmp_path: Path) -> None:
    path = tmp_path / "evals.jsonl"
    path.write_text('{"id": "1"}\n{"id": "2"}\n{broken\n', encoding="utf-8")
    # The line number is the whole point: finding line 3 of 3 is easy, finding
    # line 8213 of 50000 without it is not.
    with pytest.raises(t.DataFileError, match="3"):
        t.load_jsonl(path)


def test_load_jsonl_on_empty_file(tmp_path: Path) -> None:
    path = tmp_path / "empty.jsonl"
    path.write_text("", encoding="utf-8")
    assert t.load_jsonl(path) == []


def test_deep_get_walks_nested_keys() -> None:
    response = {"usage": {"input_tokens": 10, "output_tokens": 25}}
    assert t.deep_get(response, "usage.input_tokens") == 10


def test_deep_get_returns_default_for_missing_path() -> None:
    response = {"usage": {"input_tokens": 10}}
    assert t.deep_get(response, "usage.cache_tokens", 0) == 0
    assert t.deep_get(response, "nothing.here", 0) == 0


def test_deep_get_survives_a_null_intermediate_value() -> None:
    # This is why `.get("usage", {}).get("input_tokens")` is not enough: the key
    # exists, so the {} default never applies, and None has no .get().
    response: dict[str, object] = {"usage": None}
    assert t.deep_get(response, "usage.input_tokens", 0) == 0


def test_deep_get_handles_a_single_key() -> None:
    assert t.deep_get({"id": "msg_1"}, "id") == "msg_1"


def test_find_json_files_recurses_and_sorts(tmp_path: Path) -> None:
    (tmp_path / "nested").mkdir()
    (tmp_path / "b.json").write_text("{}", encoding="utf-8")
    (tmp_path / "a.json").write_text("{}", encoding="utf-8")
    (tmp_path / "nested" / "c.json").write_text("{}", encoding="utf-8")
    (tmp_path / "ignore.txt").write_text("no", encoding="utf-8")

    assert t.find_json_files(tmp_path) == [
        tmp_path / "a.json",
        tmp_path / "b.json",
        tmp_path / "nested" / "c.json",
    ]


def test_find_json_files_on_missing_directory(tmp_path: Path) -> None:
    assert t.find_json_files(tmp_path / "does-not-exist") == []


def test_read_csv_rows_keys_by_header(tmp_path: Path) -> None:
    path = tmp_path / "data.csv"
    path.write_text("name,score\nalpha,1\nbeta,2\n", encoding="utf-8")
    assert t.read_csv_rows(path) == [
        {"name": "alpha", "score": "1"},
        {"name": "beta", "score": "2"},
    ]


def test_read_csv_rows_handles_quoted_newlines(tmp_path: Path) -> None:
    # The case that breaks when you forget newline="" on the open() call.
    path = tmp_path / "data.csv"
    path.write_text('name,note\nalpha,"line one\nline two"\n', encoding="utf-8")
    assert t.read_csv_rows(path) == [{"name": "alpha", "note": "line one\nline two"}]


def test_read_csv_rows_on_header_only_file(tmp_path: Path) -> None:
    path = tmp_path / "data.csv"
    path.write_text("name,score\n", encoding="utf-8")
    assert t.read_csv_rows(path) == []
