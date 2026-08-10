# 03 — Comprehensions & iteration

> **Drill:** `drills/d03_comprehensions.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_03_comprehensions.py`

Reshaping collections is most of what data-handling code does, and Python has dedicated syntax
for it. This is a short topic — the ideas are small — but the payoff is that a lot of real code
stops looking like noise.

## The comprehension

Three loops that do the same thing, in decreasing order of ceremony:

```python
# 1. the long way
lengths = []
for message in messages:
    lengths.append(len(message["content"]))

# 2. the comprehension
lengths = [len(m["content"]) for m in messages]

# 3. with a filter
lengths = [len(m["content"]) for m in messages if m["role"] == "user"]
```

Read it in the order it executes, which is *not* left to right: **for** … **if** … then the
expression at the front. "For each message, if it's from the user, take its content length."

Dict and set comprehensions use the same shape:

```python
{m["role"]: len(m["content"]) for m in messages}  # dict
{m["role"] for m in messages}  # set — unique roles
(len(m["content"]) for m in messages)  # generator! see topic 08
```

That last one with round brackets is not a tuple comprehension — there is no such thing. It is
a **generator expression**, which computes lazily. Topic 08 is entirely about why that matters.

### When not to use one

A comprehension should fit on one line and do one thing. The moment you want two filters, a
nested loop, and a conditional expression, write the loop:

```python
# Nobody can read this.
result = [f(x) for sub in data for x in sub if x.ok and x.score > 0.5 if x.id not in seen]
```

AGENTS.md is explicit about this: "prefer the clear implementation over the clever one." A
comprehension is clearer than a loop for simple map/filter work and worse for anything else.
There is no prize for fitting it on one line.

## `enumerate` — index and value together

```python
for i, chunk in enumerate(chunks):
    print(f"chunk {i}: {chunk}")

for i, chunk in enumerate(chunks, start=1):  # human-friendly numbering
    print(f"chunk {i}: {chunk}")
```

The alternative — `for i in range(len(chunks))` then `chunks[i]` — works, and marks you as
someone who learned Python from a C tutorial. `enumerate` is the idiom.

## `zip` — walk two sequences in lockstep

```python
for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

**The gotcha:** `zip` stops at the shortest input, silently. If `names` has 10 entries and
`scores` has 9, you get 9 pairs and no warning. When the lengths *should* match, say so:

```python
zip(names, scores, strict=True)  # raises ValueError on length mismatch (3.10+)
```

Use `strict=True` by default. In Phase 4 you will zip a list of text chunks against a list of
embedding vectors returned by an API. If a chunk gets dropped, every embedding after it is
silently attached to the wrong text, and your retrieval is quietly, unfixably wrong. That bug
is nearly invisible without `strict=True`.

`zip` also inverts itself, which is occasionally handy:

```python
pairs = [("a", 1), ("b", 2)]
letters, numbers = zip(*pairs)  # ('a', 'b'), (1, 2)
```

## `sorted` with `key=`

```python
sorted(results, key=lambda r: r["score"])  # ascending
sorted(results, key=lambda r: r["score"], reverse=True)  # descending — top-scoring first
sorted(words, key=len)  # any callable works
sorted(results, key=lambda r: (-r["score"], r["title"]))  # score desc, then title asc
```

`key` is a function applied to each element to produce the value actually compared. That tuple
trick in the last line is the standard way to sort by multiple fields with different
directions: negate the numeric one.

`sorted()` returns a new list; `list.sort()` sorts in place and returns `None`. Same
distinction as `{**a, **b}` versus `.update()` from topic 01, and the same failure mode —
`results = results.sort()` assigns `None` and deletes your data.

Reranking search results by score is *the* Phase 4 operation. You will write
`sorted(hits, key=lambda h: h.score, reverse=True)[:top_k]` many times.

## Where this shows up later

- **Phase 4** — zipping chunks to embeddings (use `strict=True`), sorting hits by score.
- **Phase 6** — aggregating eval results into per-metric summaries.
- **Everywhere** — reshaping API responses into the shape your code wants.

## Do the drills

`drills/d03_comprehensions.py`. Six functions. One of them has a test with mismatched input
lengths — that is the `strict=True` lesson, delivered the hard way.
