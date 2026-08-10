"""Topic 05 — Files & data.

Read `lessons/05-files-and-json.md` first.

    uv run pytest phases/01-foundations/part-a/tests/test_05_files_and_json.py
"""

from __future__ import annotations

from pathlib import Path


class DataFileError(Exception):
    """Raised when a data file exists but its contents cannot be used."""


def read_json_object(path: Path) -> dict[str, object]:
    """Read a JSON file that must contain an object at the top level.

    Read with `encoding="utf-8"` explicitly — the platform default differs
    between your laptop and a container, and the difference only shows up when
    a file contains a non-ASCII character.

    Args:
        path: File to read.

    Returns:
        The parsed object.

    Raises:
        FileNotFoundError: If `path` does not exist. Let pathlib raise this one
            itself; do not catch and re-raise it.
        DataFileError: If the contents are not valid JSON, or are valid JSON
            but not an object. Chain from the underlying error with `from exc`.
    """
    raise NotImplementedError("Exercise 5.1")


def write_json_object(path: Path, data: dict[str, object]) -> None:
    """Write `data` as human-readable JSON, creating parent directories.

    Requirements the test checks:
      - parent directories are created if missing, and writing twice does not
        crash the second time
      - indent of 2
      - keys sorted, so two runs produce a diffable, identical file
      - non-ASCII characters written as themselves, not \\uXXXX escapes
      - UTF-8 encoding, stated explicitly

    Args:
        path: Destination file.
        data: The object to serialise.
    """
    raise NotImplementedError("Exercise 5.2")


def load_jsonl(path: Path) -> list[dict[str, object]]:
    """Read a JSONL file — one JSON object per line.

    The format used for eval datasets from Phase 6 on. Blank lines (and
    whitespace-only lines) are skipped, not treated as errors.

    When a line will not parse, the error message must include the 1-based line
    number. "Expecting value: line 1 column 1" is useless when the file has
    50,000 lines; "line 8,213" is actionable.

    Args:
        path: The .jsonl file.

    Returns:
        One dict per non-blank line, in file order.

    Raises:
        DataFileError: If any non-blank line is not a valid JSON object. The
            message must contain the offending line number.
    """
    raise NotImplementedError("Exercise 5.3")


def deep_get(payload: dict[str, object], dotted_path: str, default: object = None) -> object:
    """Read a nested value using a dotted path, without raising on absence.

    `deep_get(response, "usage.input_tokens", 0)` should walk response["usage"]
    then ["input_tokens"]. If any level is missing — or if an intermediate
    value is not a dict, which happens when an API returns null for an object —
    return `default` instead of raising.

    Args:
        payload: The nested structure.
        dotted_path: Keys joined by ".", e.g. "usage.input_tokens".
        default: Returned when the path does not resolve.

    Returns:
        The value at that path, or `default`.
    """
    raise NotImplementedError("Exercise 5.4")


def find_json_files(root: Path) -> list[Path]:
    """Find every .json file under `root`, recursively, in sorted order.

    Sorted because filesystem iteration order is not guaranteed, and a
    pipeline whose output depends on directory ordering is not reproducible.

    Args:
        root: Directory to search.

    Returns:
        Paths to every .json file at any depth, sorted. Empty list if `root`
        does not exist.
    """
    raise NotImplementedError("Exercise 5.5")


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    """Read a CSV into a list of dicts keyed by the header row.

    Use `csv.DictReader`. Open the file with `newline=""` — the csv module
    handles line endings itself, and omitting this corrupts any field
    containing a quoted newline.

    Args:
        path: The .csv file.

    Returns:
        One dict per data row. Every value is a string; csv has no types.
    """
    raise NotImplementedError("Exercise 5.6")
