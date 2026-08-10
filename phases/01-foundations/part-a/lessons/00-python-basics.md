# 00 — Python basics

> **Drill:** `drills/d00_python_basics.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_00_python_basics.py`

The language itself: variables, numbers, strings, booleans, `if`/`elif`/`else`, and loops.
Start here if Python is new. If it is a refresher, read the **gotcha** callouts and skip the
rest — they are the parts that still bite people who have written Python for years.

Everything in topics 01 onward assumes this.

## Variables

```python
model = "claude-sonnet-5"
max_tokens = 1024
temperature = 0.7
streaming = True
```

No declaration keyword, no type required. A variable is a **name bound to an object** — and
you can rebind it to a different type at any time. Python will let you; pyright will not, once
the name has a known type, which is the point of the annotations you will write everywhere.

Annotate when the type is not obvious from the value:

```python
retries: int = 0
last_error: str | None = None  # the value says nothing about the None case
```

`snake_case` for variables, `UPPER_SNAKE` for constants. AGENTS.md requires it and ruff enforces it.

## Numbers

Two types you will actually use: `int` (whole, unlimited size) and `float` (decimal).

```python
tokens = 1500  # int
price = 0.003  # float
big = 1_500_000  # underscores are ignored — purely for readability
```

Arithmetic:

```python
7 + 2  # 9
7 - 2  # 5
7 * 2  # 14
7 / 2  # 3.5    <- true division, ALWAYS returns a float
7 // 2  # 3      <- floor division, stays an int
7 % 2  # 1      <- remainder
7**2  # 49     <- power
```

> **Gotcha:** `/` always produces a `float`, even when it divides evenly. `10 / 5` is `2.0`,
> not `2`. If you need an int — a token count, an index, a batch size — use `//`. Passing a
> float where a provider expects an integer `max_tokens` is a 400 error.

Floats are approximate:

```python
0.1 + 0.2 == 0.3  # False
round(0.1 + 0.2, 10) == 0.3  # True
```

This is binary floating point, not a Python quirk — every language does it. It matters when
you compare computed costs. Compare with a tolerance, or use `round()`. In tests, pytest gives
you `pytest.approx()` for exactly this.

Converting:

```python
int("42")  # 42
float("0.7")  # 0.7
str(42)  # '42'
int(3.9)  # 3   — truncates toward zero, does NOT round
round(3.9)  # 4
```

## Strings

```text
name = "claude"
also_fine = 'claude'      # single and double quotes mean the same thing
multi = """line one
line two"""
```

Both quote styles work identically. This repo standardises on double quotes because ruff
rewrites single to double on format — so write `"` and save yourself the churn.

The methods you will actually reach for:

```python
"  hi  ".strip()  # 'hi'        — trims whitespace both ends
"Claude".lower()  # 'claude'
"claude".upper()  # 'CLAUDE'
"a-b-c".replace("-", "_")  # 'a_b_c'
"a,b,c".split(",")  # ['a', 'b', 'c']
",".join(["a", "b"])  # 'a,b'       — note: the separator calls join
"claude-5".startswith("claude")  # True
"model" in "model_name"  # True  — substring test
len("claude")  # 6
"claude"[0]  # 'c'
```

> **Gotcha:** strings are **immutable**. `text.strip()` does not change `text`, it returns a
> new string. `text.strip()` on its own line does nothing at all — you must assign the result:
> `text = text.strip()`. Same for `.lower()`, `.replace()`, and every other string method.

f-strings embed expressions directly:

```python
f"{model} at {temperature}"  # 'claude-sonnet-5 at 0.7'
f"{tokens:,}"  # '1,500'   — thousands separators
f"{price:.4f}"  # '0.0030'  — 4 decimal places
f"{ratio:.1%}"  # '85.0%'   — as a percentage
f"{tokens=}"  # 'tokens=1500' — self-documenting debug output
```

Topic 01 goes further on formatting; this is enough to start.

## Booleans and comparison

```python
True, False  # note the capitals
5 > 3  # True
5 == 5  # equality — TWO equals signs
5 != 3  # not equal
0 <= temperature <= 2  # chaining works, and reads exactly as it looks
```

> **Gotcha:** `=` assigns, `==` compares. `if x = 5:` is a syntax error in Python (unlike C),
> which is a mercy.

Combining:

```python
a and b  # both
a or b  # either
not a  # negation
```

`and`/`or` **short-circuit** — they stop as soon as the answer is known:

```python
if value is not None and value.strip():     # .strip() never runs when value is None
```

That ordering is load-bearing. Reversed, it raises `AttributeError` on `None`. You will use
this pattern constantly for optional API fields.

`is` vs `==`:

```python
x == y  # same VALUE  — what you almost always want
x is y  # same OBJECT in memory
```

Use `is` only for `None`, `True`, and `False`. `value is None` is correct; `name is "claude"`
is a bug that happens to work sometimes.

## if / elif / else

```python
if word_count > 2000:
    size = "long"
elif word_count > 500:
    size = "medium"
else:
    size = "short"
```

**Indentation is the syntax.** No braces. Four spaces, consistently — ruff enforces this.

Clauses are checked top to bottom and **the first match wins**; the rest are skipped. That is
why the order above works: by the time `elif word_count > 500` runs, you already know the
count is not above 2000. Write these ranges from widest to narrowest, or they collapse into
one branch.

There is also a conditional expression, for when you are picking between two values:

```python
label = "long" if word_count > 2000 else "short"
```

Fine for two outcomes. For three or more, use the statement form.

## for loops

```python
for word in text.split():
    print(word)

for i in range(5):  # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 6):  # 1, 2, 3, 4, 5
    print(i)
```

Python's `for` iterates over **items**, not indices. There is no `for (i = 0; i < n; i++)`.

> **Gotcha:** `range(5)` stops *before* 5. Ranges and slices in Python are always
> "start inclusive, stop exclusive." It is consistent everywhere, which makes
> `range(a, b)` produce exactly `b - a` items.

The accumulator pattern, which you will write endlessly:

```python
total = 0
for count in token_counts:
    total = total + count  # or: total += count
```

`+=` is shorthand for "add and rebind." `-=`, `*=`, `//=` work the same way.

## while loops

Use `for` when you know what you are iterating over, `while` when you are waiting on a
condition:

```python
delay = 1
while delay < 60:
    print(f"retrying in {delay}s")
    delay = delay * 2  # 1, 2, 4, 8, 16, 32
```

> **Gotcha:** something inside the loop **must** eventually make the condition false. Forget
> the `delay = delay * 2` line and it runs forever. Every infinite loop you ever write will be
> a missing update like this one.

That doubling is real: it is exponential backoff, which you will implement against a rate-limited
provider in Phase 2.

## break and continue

```python
for line in lines:
    if not line.strip():
        break  # stop the loop entirely

for count in counts:
    if count < 0:
        continue  # skip to the next iteration
    total += count
```

`break` exits. `continue` skips the rest of *this* pass and starts the next. Both apply only to
the innermost loop.

`continue` is the clean way to say "this item does not qualify" without indenting the real work
inside an `if`.

## Where this shows up later

Everywhere — this is the language. Specifically:

- **Topic 01** builds directly on strings, truthiness, and `if`/`else`.
- **Topic 04** turns `if` checks into raised exceptions.
- **Phase 2** — exponential backoff is the `while` loop above with a sleep in it.

## Do the drills

`drills/d00_python_basics.py`. Nine functions, deliberately small. If they feel easy, you are
ready for topic 01 — go.
