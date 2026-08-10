# 01 — Core mechanics

> **Drill:** `drills/d01_core_mechanics.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_01_core_mechanics.py`
>
> **Assumes [topic 00](00-python-basics.md):** variables, numbers, strings, `if`/`elif`/`else`,
> `for` and `while`. Start there if any of that is unfamiliar.

The four container types, slicing, truthiness, and formatting. The phase doc says dicts "get
special attention — every API payload you'll ever touch is one." That is not a figure of
speech. Here is a real Anthropic API response, trimmed:

```python
{
    "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
    "type": "message",
    "role": "assistant",
    "content": [{"type": "text", "text": "Hello!"}],
    "usage": {"input_tokens": 10, "output_tokens": 25},
}
```

A dict, containing a list, containing a dict. You will spend the next seven phases reading,
building, and validating shapes like this one. Everything below is in service of that.

## The four containers, and how to choose

| Type | Ordered | Mutable | Duplicates | Lookup cost | Reach for it when |
| --- | --- | --- | --- | --- | --- |
| `list` | yes | yes | yes | O(n) by value | A sequence you will append to or iterate — `messages`, `chunks` |
| `dict` | yes (insertion) | yes | keys unique | O(1) by key | Anything keyed — every JSON object, every counter, every config |
| `set` | no | yes | no | O(1) | Membership tests and dedupe — "have I seen this ID?" |
| `tuple` | yes | **no** | yes | O(n) | A fixed-shape record, or a dict key |

The mistake to avoid is using a `list` for membership. `if item_id in seen_list` walks the
whole list every time; with 10,000 ingested documents that is 100 million comparisons over the
run. `if item_id in seen_set` is a hash lookup. In Phase 4 you will dedupe a document corpus
and this difference is the whole ballgame.

The other mistake is reaching for a `set` when you need order. Sets have none. If you need
"unique, but in the order I first saw them," you need both: a set to remember, a list to
record. Drill 1.1 is exactly this.

### Dicts: the three ways to read a key

```python
payload = {"role": "user", "content": "hi"}

payload["role"]  # 'user'   — raises KeyError if absent
payload.get("name")  # None     — returns None if absent
payload.get("name", "anon")  # 'anon'   — returns your default if absent
```

Use `[]` when a missing key is a **bug** and you want it to blow up loudly. Use `.get()` when
a missing key is **expected** — optional fields in an API response, for instance. Choosing
`.get()` everywhere out of caution is a common beginner reflex and it is wrong: it converts
loud failures into silent `None`s that surface three functions later with no useful traceback.

The counting idiom, which you will write hundreds of times:

```python
counts: dict[str, int] = {}
for message in messages:
    role = message["role"]
    counts[role] = counts.get(role, 0) + 1
```

`counts[role] = counts.get(role, 0) + 1` reads as "whatever was there, or zero, plus one."

### Merging dicts without mutating

```python
merged = {**defaults, **overrides}  # or: defaults | overrides  (3.9+)
```

Both build a **new** dict; later keys win. Compare with `defaults.update(overrides)`, which
mutates `defaults` in place and returns `None`. That in-place version is a classic source of
"why did my default config change?" bugs, because dicts are passed by reference — the caller's
dict is the same object as yours. Drill 1.6 tests that you did not mutate the input.

## Slicing, and the `-0` trap

```python
items = ["a", "b", "c", "d", "e"]
items[1:3]  # ['b', 'c']       — start inclusive, stop exclusive
items[-2:]  # ['d', 'e']       — last two
items[:-1]  # ['a','b','c','d'] — everything but the last
```

Now the trap. "Give me the last `n` items" looks like `items[-n:]`. It works for `n = 2`. It
breaks for `n = 0`:

```python
n = 0
items[-n:]  # ['a','b','c','d','e']  — because -0 == 0, so this is items[0:]
```

You asked for nothing and got everything. In a chat client that trims history to the last `n`
turns, this sends the entire conversation to the model at full token cost. Drill 1.3 has a
test for `n = 0` specifically. Guard it explicitly.

## Truthiness vs `is None`

Every empty thing in Python is falsy: `0`, `0.0`, `""`, `[]`, `{}`, `set()`, `None`.

```python
if not value:
    ...  # true for "", 0, [], AND None
if value is None:
    ...  # true only for None
```

These differ in exactly the cases that matter. A `max_tokens` of `0`, a temperature of `0.0`,
an empty string returned by a model — all falsy, none of them "missing." The rule:

- Testing **presence** of an optional value → `is None`.
- Testing **emptiness** of a container you know exists → truthiness (`if not messages`).

Getting this wrong silently replaces a legitimate `0` with a default. It is one of the most
common bugs in configuration code.

## f-strings

```python
cost = 0.0123456
tokens = 1_234_567

f"{tokens:,} tokens"  # '1,234,567 tokens'
f"${cost:.4f}"  # '$0.0124'      — 4 decimal places
f"{'claude':<12}|"  # 'claude      |' — left-pad to width 12
f"{cost=}"  # 'cost=0.0123456' — self-documenting, great for debugging
```

The `:,` and `:.4f` specifiers show up constantly in this field because you are forever
printing token counts and fractions of a cent. `f"{x=}"` is the fastest debug print there is.

## Where this shows up later

- **Phase 1 `wrangle`** — the whole project is dict-wrangling: read JSON, reshape, dedupe.
- **Phase 2** — a chat client keeps `messages: list[dict[str, str]]` and trims it by slicing.
- **Phase 4** — deduping a corpus with sets; counting retrieval hits with dict accumulation.

## Do the drills

Open `drills/d01_core_mechanics.py`. Seven functions, each with a docstring saying what it
should do. Run the test file above; work until it is green.
