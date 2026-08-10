# 08 — Generators & iterators

> **Drill:** `drills/d08_generators.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_08_generators.py`

The phase doc says this "is literally how token streaming works — Part B depends on it." That
is the plainest statement in the whole document. When you watch Claude type a response one word
at a time, a generator is what makes that possible. This topic is the last Part A topic that
Part B directly builds on, and the most important one.

## A generator is a function that pauses

Any function containing `yield` is a generator function. Calling it runs **no code at all** —
it returns a generator object. Code runs only when you iterate:

```python
def stream_words(text: str):
    for word in text.split():
        print(f"  (producing {word})")
        yield word


gen = stream_words("hello world")  # nothing printed yet
next(gen)  # prints "(producing hello)", returns 'hello'
next(gen)  # prints "(producing world)", returns 'world'
next(gen)  # raises StopIteration
```

`yield` hands a value to the caller and **freezes the function** — local variables, position in
the loop, everything. The next request resumes exactly there. `return` cannot do this; it
destroys the frame.

`for x in gen:` is just `next()` in a loop with `StopIteration` handled for you.

## Why this matters for LLM work

A model generates tokens over several seconds. Two ways to expose that:

```python
def get_response(prompt: str) -> str:  # collect everything, then return
    ...  # user stares at nothing for 4s


def stream_response(prompt: str) -> Iterator[str]:  # yield each token
    ...  # first word appears in 200ms
```

Same total time. Wildly different experience, and it is entirely a generator's doing. Phase 1's
`mockstream` builds the server side of this; Phase 2's chat client consumes it.

The second payoff is memory. A generator holds **one item at a time**:

```python
lines = path.read_text().splitlines()        # a 2GB file is now 2GB of RAM
for line in path.open():                     # one line of RAM
```

In Phase 4 you will chunk a document corpus that does not fit in memory. Generators are how.

## The three costs

Laziness is a trade, and these three catch people:

**1. A generator is exhausted after one pass.**

```python
gen = (x * 2 for x in [1, 2, 3])
list(gen)  # [2, 4, 6]
list(gen)  # []   <-- empty, and no error to tell you why
```

Silent, not loud. If you need the values twice, materialise once with `list(gen)` and reuse
that. Drill 8.6 makes you handle exactly this.

**2. `len()` does not work.** There is no count without consuming it. `sum(1 for _ in gen)`
counts and exhausts it.

**3. Exceptions surface where you iterate, not where you call.** A generator function's body
does not run at call time, so a `try` around the call catches nothing:

```python
try:
    gen = risky_generator()  # no exception possible here
except ValueError:
    ...  # never fires

for item in gen:  # the exception comes out HERE
    ...
```

This one costs real debugging time when a stream fails mid-flight and the traceback points at
a `for` loop far from the cause.

## `yield from` — delegating to another iterable

```python
def stream_conversation(messages: list[str]):
    for message in messages:
        yield from stream_words(message)  # yield each of ITS items
        yield "\n"
```

`yield from x` is shorthand for `for item in x: yield item`. It composes generators into
pipelines, each stage lazy:

```python
words = stream_words(text)
cleaned = (w.strip().lower() for w in words)
long_only = (w for w in cleaned if len(w) > 3)
```

Nothing has run yet. Iterating `long_only` pulls one word through all three stages, then the
next. This is exactly how an SSE pipeline is built in Phase 1.

## Typing generators

```python
from collections.abc import Iterator


def stream_words(text: str) -> Iterator[str]: ...
```

`Iterator[str]` is the right annotation for a generator you only iterate — which is all of
them, here. `Generator[str, None, None]` is the full form and is noise for this purpose. Use
`Iterable[str]` for a **parameter**, since it accepts lists and generators alike; use
`Iterator[str]` for a **return type**.

## itertools, briefly

Two that earn their place:

```python
from itertools import islice, batched

islice(gen, 5)  # first 5 items, still lazy — the generator's [:5]
batched(gen, 10)  # tuples of 10 — for batching API calls (3.12+)
```

`batched` is precisely what you need for the Anthropic Batch API and for embedding calls that
cap batch size. It arrived in 3.12, which this repo requires.

## Where this shows up later

- **Phase 1 `mockstream`** — an async generator yields SSE chunks with realistic pacing.
- **Phase 2** — the chat client consumes that stream and prints tokens as they land.
- **Phase 4** — chunking a corpus lazily; `batched` for embedding requests.

Async generators (`async def` + `yield`, consumed with `async for`) are Part B. The mental
model is identical; only the syntax changes.

## Do the drills

`drills/d08_generators.py`. Seven functions. Several tests assert on **laziness itself** — that
nothing has been computed before you ask — so returning a list where a generator is required
will fail even when the values are right.
