# 10 — Type hints

> **Drill:** `drills/d10_type_hints.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_10_type_hints.py`

You have been typing every signature since topic 01. This lesson fills in the parts that were
used without explanation and adds the two constructs that matter most in this field: `Literal`
and `TypedDict`.

AGENTS.md sets the bar: every signature fully typed including the return, pyright in **strict**
mode, no blanket `Any`. The reason is in the phase doc — "AI apps are schema-heavy; typing
catches contract breaks before runtime." A wrong `role` string is a 400 from the provider,
after the network round trip and after you paid for the tokens. pyright catches it in your
editor for free.

## Types are checked by pyright, never by Python

```python
def count(text: str) -> int:
    return "not an int"  # runs fine; pyright flags it
```

Annotations are metadata. Python does not enforce them at runtime — Pydantic does that, at
boundaries you choose, and Part B covers it. Everything below is a static-analysis contract.

## The basics you have been using

```python
def summarise(messages: list[dict[str, str]], limit: int = 10) -> str: ...
```

Built-in generics (`list[str]`, `dict[str, int]`, `tuple[str, int]`) work directly since 3.9.
Do not import `List` or `Dict` from `typing`; that spelling is deprecated.

**Tuples have two forms**, and mixing them up is a common error:

```python
tuple[str, int]  # exactly two items: a str then an int
tuple[str, ...]  # any number of strs
```

## Optional and unions

```python
def find(key: str) -> str | None: ...  # modern spelling
def find(key: str) -> Optional[str]: ...  # older; identical meaning
```

Use `X | None`. `Optional[X]` means the same thing and reads like "this argument is optional,"
which is not what it means — it means "this value may be None."

pyright forces you to handle the `None` before using the value:

```python
result = find("a")
print(result.upper())  # error: "upper" is not a known attribute of "None"

if result is not None:
    print(result.upper())  # fine — pyright narrowed the type
```

That narrowing is the feature. Every `AttributeError: 'NoneType' object has no attribute` you
have ever seen is a bug pyright would have caught.

## `Literal` — a closed set of strings

```python
from typing import Literal

Role = Literal["user", "assistant", "system"]


def add(role: Role, content: str) -> None: ...


add("user", "hi")  # fine
add("User", "hi")  # pyright: "User" is not assignable to Role
```

AGENTS.md requires `Literal` for closed sets of string values, and this is why. `role: str`
accepts `"usr"`, `"User"`, and `"banana"`. `role: Role` accepts three strings, and your editor
autocompletes them.

Everywhere in this stack has a closed set: message roles, model IDs, finish reasons, stream
event types, HTTP methods. Type them all this way.

`Literal` also drives **exhaustiveness checking**, via `assert_never`:

```python
from typing import assert_never


def label(role: Role) -> str:
    if role == "user":
        return "You"
    if role == "assistant":
        return "Claude"
    if role == "system":
        return "System"
    assert_never(role)  # pyright: only valid if nothing is left unhandled
```

pyright narrows `role` a little further with each check. By the last line it should be `Never`
— the type with no possible values — and `assert_never` asserts exactly that. Add a fourth
role to `Role` later and this line becomes a type error pointing straight at the gap, in every
function that stopped being exhaustive. At runtime the call is unreachable.

That is refactoring you can trust, and it is worth the one extra line.

## `TypedDict` — a dict with a known shape

AGENTS.md: "`TypedDict` for untyped-JSON boundaries you do not own."

```python
from typing import TypedDict


class Usage(TypedDict):
    input_tokens: int
    output_tokens: int


def total(usage: Usage) -> int:
    return usage["input_tokens"] + usage["output_tokens"]  # keys are checked
```

It is a plain `dict` at runtime — zero cost, no class, no conversion. It is *only* a static
description. `usage["input_tokns"]` is now a type error rather than a 2am `KeyError`.

Optional keys use `NotRequired`:

```python
from typing import NotRequired


class Message(TypedDict):
    role: str
    content: str
    name: NotRequired[str]  # may be absent
```

### TypedDict vs dataclass vs Pydantic

Three ways to describe a shape, and the choice is not arbitrary:

| | `TypedDict` | `@dataclass` | Pydantic |
| --- | --- | --- | --- |
| Runtime object | plain `dict` | an instance | an instance |
| Validates | no | no | **yes** |
| Cost | zero | near zero | some |
| Use for | JSON you pass through | internal values | **untrusted input** |

- Reshaping an API response you immediately re-serialise → **TypedDict**.
- An internal value you construct yourself → **dataclass** (topic 07).
- Anything crossing a trust boundary — API responses you depend on, user input, LLM output →
  **Pydantic**, in Part B.

## Typing functions: `Callable`

```python
from collections.abc import Callable

Callable[[str], int]  # takes a str, returns an int
Callable[[], None]  # takes nothing
Callable[..., str]  # any arguments, returns str — for decorators
```

Import from `collections.abc`, not `typing`. You used all three in topics 02 and 09.

## Parameters vs returns: be generous in, specific out

```python
def process(items: Iterable[str]) -> list[str]: ...
```

Accept the **widest** type you can handle — `Iterable[str]` takes lists, tuples, sets, and
generators. Return the **most specific** type you actually produce — a caller who gets
`list[str]` can index it; one who gets `Iterable[str]` cannot.

## On `Any`

```python
def parse(raw: str) -> Any: ...  # switches off type checking downstream
```

`Any` is not "unknown" — it is "stop checking." It spreads: every value derived from an `Any`
is also unchecked. AGENTS.md forbids silencing pyright with it.

Use `object` instead when you genuinely do not know. `object` is honest — it forces the caller
to narrow with `isinstance` before doing anything, which is exactly the behaviour you want at
a JSON boundary. That is why `json.loads` results are typed `object` in the topic 04 and 05
solutions.

## Where this shows up later

- **Phase 2** — `Literal` for model IDs and roles; a `Protocol` for the client.
- **Phase 3** — Pydantic models generating JSON Schema for structured outputs.
- **Phase 5** — typed tool signatures converted into the schema a model consumes.

## Do the drills

`drills/d10_type_hints.py`. Six exercises. The tests check runtime behaviour, but the real
check is `uv run pyright` — a wrong annotation passes pytest and fails pyright, which is the
whole point of having both.
