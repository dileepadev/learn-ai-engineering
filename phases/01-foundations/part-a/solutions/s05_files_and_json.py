"""Topic 05 — Files & data: reference solutions."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import cast


class DataFileError(Exception):
    """Raised when a data file exists but its contents cannot be used."""


def read_json_object(path: Path) -> dict[str, object]:
    """Read a JSON file that must contain an object at the top level."""
    # No try/except around read_text: a missing file is the caller's problem and
    # FileNotFoundError already says exactly that, with the path in the message.
    raw = path.read_text(encoding="utf-8")

    try:
        parsed: object = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise DataFileError(f"{path} is not valid JSON") from exc

    if not isinstance(parsed, dict):
        raise DataFileError(f"{path} contains a {type(parsed).__name__}, expected an object")

    # isinstance narrows the container but not its contents, so pyright sees
    # dict[Unknown, Unknown]. JSON object keys are always strings; the cast
    # records that guarantee without switching off checking the way `Any` would.
    return cast("dict[str, object]", parsed)


def write_json_object(path: Path, data: dict[str, object]) -> None:
    """Write `data` as human-readable JSON, creating parent directories."""
    # exist_ok=True makes this idempotent; parents=True creates the whole chain.
    # Without both, the second run of any pipeline crashes.
    path.parent.mkdir(parents=True, exist_ok=True)

    # sort_keys gives byte-identical output for equal data, which makes the file
    # diffable in git. ensure_ascii=False keeps "café" readable instead of
    # "café" -- both are valid JSON, only one is reviewable.
    text = json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False)
    path.write_text(text + "\n", encoding="utf-8")


def load_jsonl(path: Path) -> list[dict[str, object]]:
    """Read a JSONL file — one JSON object per line."""
    records: list[dict[str, object]] = []

    # enumerate(start=1) because humans and text editors count lines from 1.
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue

        try:
            parsed: object = json.loads(line)
        except json.JSONDecodeError as exc:
            # The line number is the entire value of this error over the raw one.
            raise DataFileError(f"{path} line {line_number}: invalid JSON") from exc

        if not isinstance(parsed, dict):
            raise DataFileError(
                f"{path} line {line_number}: expected an object, got {type(parsed).__name__}"
            )
        records.append(cast("dict[str, object]", parsed))

    return records


def deep_get(payload: dict[str, object], dotted_path: str, default: object = None) -> object:
    """Read a nested value using a dotted path, without raising on absence."""
    keys = dotted_path.split(".")

    # Walk every key except the last, descending one level each time. Splitting
    # the final lookup out keeps `level` a dict throughout, so there is no
    # "either a dict or a leaf value" variable to reason about.
    level: dict[str, object] = payload
    for key in keys[:-1]:
        nested = level.get(key)
        # The isinstance check handles the case that trips up
        # `payload.get("a", {}).get("b")`: an API returning null for an object.
        # `nested` would be None there, and None has no .get().
        if not isinstance(nested, dict):
            return default
        # isinstance narrows the container but not its contents, so pyright has
        # dict[Unknown, Unknown] here. JSON object keys are always strings.
        level = cast("dict[str, object]", nested)

    return level.get(keys[-1], default)


def find_json_files(root: Path) -> list[Path]:
    """Find every .json file under `root`, recursively, in sorted order."""
    if not root.exists():
        return []
    # rglob recurses; glob does not. sorted() because the filesystem makes no
    # ordering promise, and unordered input means unreproducible output.
    return sorted(root.rglob("*.json"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    """Read a CSV into a list of dicts keyed by the header row."""
    # newline="" is required by the csv module: it does its own line-ending
    # handling, and letting Python translate them first breaks quoted newlines.
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))
