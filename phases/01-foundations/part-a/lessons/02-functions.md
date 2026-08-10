# 02 — Functions, properly

> **Drill:** `drills/d02_functions.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_02_functions.py`

The phase doc says "provider SDKs and frameworks assume fluency here." Look at a real call:

```python
client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "hi"}],
    temperature=0.7,
)
```

Every argument is a keyword argument. FastAPI, pytest, and Pydantic are the same. This lesson
is about the machinery underneath that style — and about the one default-argument bug that
catches everyone exactly once.

## Positional vs keyword

```python
def send(model: str, prompt: str, temperature: float = 0.7) -> str: ...


send("claude-sonnet-5", "hi")  # positional
send(model="claude-sonnet-5", prompt="hi")  # keyword — clearer at the call site
send("claude-sonnet-5", temperature=0.2, prompt="hi")  # mixed; keywords can reorder
```

A bare `*` in the signature forces everything after it to be keyword-only:

```python
def send(model: str, *, temperature: float = 0.7, max_tokens: int = 1024) -> str: ...


send("claude-sonnet-5", 0.2)  # TypeError — 0.2 is not positional
send("claude-sonnet-5", temperature=0.2)  # fine
```

Do this for options. `send(model, 0.2, 1024)` is unreadable at the call site and, worse,
silently breaks if you ever reorder the parameters. Keyword-only arguments make that
impossible — the caller's code fails loudly instead of quietly passing temperature as
max_tokens. Every library in this repo's stack uses this pattern.

## The mutable default trap

This is the single most famous Python gotcha, and it is genuinely worth understanding rather
than memorising.

```python
def add_tag(tag: str, tags: list[str] = []) -> list[str]:  # WRONG
    tags.append(tag)
    return tags


add_tag("a")  # ['a']
add_tag("b")  # ['a', 'b']   <-- the list survived between calls
```

**Why:** default values are evaluated **once**, when the `def` statement runs — not on each
call. So there is exactly one list object, created at import time, shared by every call that
does not pass its own. Mutating it mutates it for everyone, forever.

The fix is a `None` sentinel:

```python
def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
```

`None` is immutable, so there is nothing to accumulate into. The fresh list is created per
call, inside the body.

This bites hardest in AI code because conversation history is a list and you are constantly
writing helpers that take one. A shared default means turn 1 of conversation B starts with all
of conversation A in it — sent to the model, billed, and reflected in the reply. ruff's
bugbear rules (`B006`) catch this, and they are enabled in this repo's config. AGENTS.md bans
it outright.

## `*args` and `**kwargs`

```python
def total(*counts: int) -> int:  # counts is a tuple
    return sum(counts)


total(1, 2, 3)  # 6


def build(**options: object) -> dict[str, object]:  # options is a dict
    return options


build(model="opus", temperature=0.2)  # {'model': 'opus', 'temperature': 0.2}
```

The stars mean "collect the rest." At a *call* site the same syntax means the opposite —
unpack:

```python
args = [1, 2, 3]
total(*args)  # same as total(1, 2, 3)

overrides = {"temperature": 0.2}
client.messages.create(model="opus", **overrides)  # spreads into keywords
```

`**kwargs` passthrough is how wrappers stay future-proof: your helper forwards options it does
not know about, so a new provider parameter works without you editing the wrapper. You will
write exactly this wrapper in Phase 2.

## Functions are values

A function without parentheses is just an object. You can put it in a list, pass it, return it.

```python
transforms = [str.strip, str.lower]
for fn in transforms:
    text = fn(text)
```

This is what `sorted(key=...)`, `@decorator`, and FastAPI's `Depends(get_db)` all rely on. In
Phase 5, an agent's tool registry is a `dict[str, Callable[..., str]]` — the model picks a
name, you look up the function and call it. Nothing more exotic than that.

The type for "a function that takes an `int` and returns a `str`" is
`Callable[[int], str]`, from `collections.abc`.

## Closures

A function defined inside another function can see the outer function's variables, and keeps
seeing them after the outer function has returned:

```python
def make_price_formatter(usd_per_million: float) -> Callable[[int], str]:
    def format_price(tokens: int) -> str:
        return f"${tokens / 1_000_000 * usd_per_million:.4f}"  # captures usd_per_million

    return format_price


haiku_price = make_price_formatter(0.80)
haiku_price(50_000)  # '$0.0400'
```

`format_price` "closed over" `usd_per_million`. This is configuration-by-construction: build a
specialised function once, call it many times, without threading the config through every call.

To **rebind** (not just read) an outer variable, you need `nonlocal`:

```python
def make_counter() -> Callable[[], int]:
    count = 0

    def increment() -> int:
        nonlocal count  # without this, `count = count + 1` creates a NEW local
        count += 1
        return count

    return increment
```

Without `nonlocal`, assignment inside a function always creates a local variable, and you get
`UnboundLocalError` for reading it before assignment. Reading alone needs no declaration;
assigning does.

## Where this shows up later

- **Phase 2** — a `**kwargs` wrapper around the provider client; keyword-only options.
- **Phase 3** — retry logic built from a function passed as a value.
- **Phase 5** — the agent tool registry: names mapped to callables.

## Do the drills

`drills/d02_functions.py`. Six functions. The mutable-default one has a test that calls it
twice — that is the test that catches the bug.
