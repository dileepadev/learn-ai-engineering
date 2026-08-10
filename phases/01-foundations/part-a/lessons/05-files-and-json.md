# 05 — Files & data

> **Drill:** `drills/d05_files_and_json.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_05_files_and_json.py`

The phase doc calls JSON "the substrate of everything LLM." Requests are JSON, responses are
JSON, tool definitions are JSON Schema, eval datasets are JSONL, and the messy export you feed
to `wrangle` is JSON. This topic is the one that most directly feeds the warm-up project.

## pathlib, not os.path

AGENTS.md requires `pathlib`. Here is why it wins:

```python
from pathlib import Path

data_dir = Path("data") / "raw"  # / is the join operator, cross-platform
path = data_dir / "export.json"

path.exists()
path.suffix  # '.json'
path.stem  # 'export'
path.parent  # Path('data/raw')
path.read_text(encoding="utf-8")  # no open()/close() needed
path.write_text(content, encoding="utf-8")
data_dir.mkdir(parents=True, exist_ok=True)
sorted(data_dir.glob("*.json"))  # or .rglob() to recurse
```

Compare `os.path.join(os.path.dirname(p), "x")` with `p.parent / "x"`. Same operation, one of
them readable.

Two habits worth forming now:

- **Always pass `encoding="utf-8"`.** Without it Python uses a platform default that differs
  between your laptop and your Docker container, and the failure appears only when a document
  contains an em-dash. Model outputs are full of non-ASCII.
- **`mkdir(parents=True, exist_ok=True)` before writing.** `exist_ok=True` makes it idempotent;
  without it a second run crashes with `FileExistsError`.

## json, deeply

```python
import json

data = json.loads(text)  # str  -> Python
text = json.dumps(data)  # Python -> str
data = json.load(file_object)  # note: no "s" = file, "s" = string
json.dump(data, file_object)
```

The `loads`/`load` naming trips everyone up once: the **s** is for *string*.

The type mapping is worth memorising, because it explains most surprises:

| JSON | Python |
| --- | --- |
| object | `dict` |
| array | `list` |
| string | `str` |
| number | `int` or `float` |
| `true` / `false` | `True` / `False` |
| `null` | `None` |

Notice what is missing: JSON has no tuples, no sets, no dates. A round-trip through JSON
turns your tuple into a list and raises `TypeError` on a `set` or a `datetime`. `wrangle`'s
"normalize dates" step exists precisely because dates arrive as strings and must be parsed.

Useful `dumps` arguments:

```python
json.dumps(data, indent=2)  # human-readable output
json.dumps(data, sort_keys=True)  # stable ordering -> diffable, hashable
json.dumps(data, ensure_ascii=False)  # keep é as é instead of é
```

`ensure_ascii=False` matters for the same reason `encoding="utf-8"` does. The default mangles
every non-English character into an escape sequence, which is valid JSON and unreadable.

### Parsing can fail, and you must assume it will

```python
try:
    data = json.loads(raw)
except json.JSONDecodeError as exc:
    raise ExtractionError(f"invalid JSON: {raw[:100]!r}") from exc
```

`json.JSONDecodeError` is a subclass of `ValueError`, so catching `ValueError` also works —
but name the specific one. This is topic 04's chaining pattern, and you will write it against
every model response you ever parse.

## JSONL — one JSON object per line

```jsonl
{"id": "1", "question": "What is RAG?", "answer": "..."}
{"id": "2", "question": "What is an embedding?", "answer": "..."}
```

This is the format for eval datasets, fine-tuning data, and the Anthropic Batch API. It exists
because you can append to it without rewriting the file, and stream it without loading
gigabytes into memory — neither of which a single big JSON array allows.

Read it a line at a time, and **report the line number when a line is malformed**. One bad
line in a 50,000-line dataset with an error that says only "Expecting value: line 1 column 1"
is genuinely painful to locate. You will build exactly this reader in Phase 6.

## Nested access

API responses nest. Reaching into them naively is fragile:

```python
tokens = response["usage"]["input_tokens"]  # KeyError if either level is absent
tokens = response.get("usage", {}).get("input_tokens", 0)  # verbose but safe
```

A small `deep_get(payload, "usage.input_tokens", default=0)` helper pays for itself within a
day. Drill 5.4 is that helper.

## csv, in passing

```python
import csv

with path.open(newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))  # each row is a dict keyed by the header
```

`DictReader` gives dicts instead of positional lists, which is what you want. `newline=""` is
required — the csv module handles line endings itself, and omitting it corrupts files
containing quoted newlines on Windows. Every value comes back as a **string**; numbers need
converting yourself.

That is genuinely all the csv you need. The phase doc says "in passing" and means it.

## Where this shows up later

- **Phase 1 `wrangle`** — read messy JSON, validate, normalize, write clean JSON.
- **Phase 3** — parse JSON out of model responses that were not asked politely enough.
- **Phase 6** — load a golden eval set from JSONL, one case per line.

## Do the drills

`drills/d05_files_and_json.py`. Six functions. The tests use pytest's `tmp_path` fixture,
which hands each test a fresh empty directory — your first look at a fixture, which topic 09
explains properly.
