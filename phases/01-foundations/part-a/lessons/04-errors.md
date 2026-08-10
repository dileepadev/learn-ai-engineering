# 04 — Errors

> **Drill:** `drills/d04_errors.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_04_errors.py`

The phase doc puts it bluntly: "API-calling code is mostly error handling; get comfortable
early." That is not an exaggeration. A production call to a model provider has to survive a
network blip, a 429 rate limit, a 500 on the provider's side, a response that is not the JSON
it promised, a timeout mid-stream, and a context-length rejection. The happy path is four
lines. The rest is this topic.

## try / except / else / finally

```python
try:
    response = call_api(prompt)
except TimeoutError:
    return None
except ValueError as exc:
    log(f"bad response: {exc}")
    raise
else:
    return response.text  # runs only if NO exception fired
finally:
    close_connection()  # runs no matter what — success, exception, or return
```

- `except` clauses are checked **top to bottom**, first match wins. Put specific before general.
- `else` runs when the `try` block completed cleanly. Its value is that it keeps the try block
  small — only the line that can actually fail goes inside.
- `finally` **always** runs. Even if you `return` from the `try`. Even if an exception is
  propagating. It is for cleanup you cannot afford to skip.

## Never catch bare

```python
try:
    result = call_api(prompt)
except:  # WRONG — catches KeyboardInterrupt and SystemExit too
    result = None

except Exception:  # still too broad, but at least interruptible
    result = None
```

A bare `except:` catches `KeyboardInterrupt`, so your Ctrl-C does nothing during a long
batch job. It also catches the `NameError` from your own typo three lines down and turns it
into `result = None`, which then fails somewhere unrelated. AGENTS.md bans it outright, and
ruff will flag it.

Catch **the exception you know how to handle**:

```python
except TimeoutError:
    ...          # I know what to do about this: retry
```

If you cannot do anything useful about an exception, do not catch it. Letting it propagate to
someone who can — or to the top, with a full traceback — is strictly better than swallowing it.

## Raising your own

```python
class ExtractionError(Exception):
    """Raised when a model response cannot be parsed into the target schema."""


raise ExtractionError(f"expected JSON object, got {value!r}")
```

Two things earn their keep here. `!r` in the f-string calls `repr()`, which shows quotes and
escapes — `got ''` versus `got ` is the difference between a diagnosable bug report and a
mystery. And a **custom exception class** lets callers catch *your* failure specifically
without also catching every unrelated `ValueError` in the call stack.

Custom exceptions inherit from `Exception`, not `BaseException`. The docstring is the whole
class body; no `pass` needed.

## Exception chaining: `raise ... from`

This is the part people skip, and it is the part that saves you at 2am.

```python
try:
    data = json.loads(raw)
except json.JSONDecodeError as exc:
    raise ExtractionError(f"model returned invalid JSON: {raw[:100]!r}") from exc
```

`from exc` attaches the original exception to yours. The traceback then reads:

```
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)

The above exception was the direct cause of the following exception:

ExtractionError: model returned invalid JSON: 'Sure! Here is the JSON:\n{...'
```

You get both layers: your domain-level message ("the model gave us junk") *and* the precise
low-level cause. Without `from exc`, Python prints "During handling of the above exception,
another exception occurred" — which is Python's way of saying it suspects your error handler
itself is broken. Use `from exc` whenever you re-raise as a different type. Use `from None`
deliberately when the original really is noise you want hidden.

This exact pattern — catch `JSONDecodeError`, re-raise as a domain error with the offending
text attached — is what you will write in Phase 3 when a model wraps its JSON in prose.

## Which exception to raise

| Situation | Raise |
| --- | --- |
| Caller passed a value of the right type but a nonsense value | `ValueError` |
| Caller passed the wrong type entirely | `TypeError` |
| A key/index that should exist does not | `KeyError` / `IndexError` |
| Something specific to your domain failed | Your own subclass |

Do not raise bare `Exception`. It gives the caller nothing to catch selectively.

## Where this shows up later

- **Phase 2** — retry-on-429 with backoff; distinguishing retryable from fatal errors.
- **Phase 3** — parse failures re-raised with the model's raw output attached.
- **Phase 5** — an agent tool that raises must return the error *to the model* as a tool
  result, not crash the loop. You cannot do that without narrow, typed exceptions.

## Do the drills

`drills/d04_errors.py`. Six functions. One asks you to build the retry-classification helper
you will genuinely reuse in Phase 2.
