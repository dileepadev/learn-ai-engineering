---
applyTo: "**/*.py"
---

# Python instructions

Applies on top of [copilot-instructions.md](../copilot-instructions.md) and
[AGENTS.md](../../AGENTS.md).

## Every file

- Full type annotations on every signature, return types included.
- Absolute imports from the project's `src/` package.
- `pathlib.Path` for filesystem work.
- Docstrings on public functions and classes: purpose, args, returns, raises.

## Pydantic v2

```python
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class Item(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    name: str
    kind: Literal["article", "video"]  # closed sets use Literal, not str

    @field_validator("name")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()
```

Serialize with `model_dump()` / `model_dump_json()`, parse with `model_validate()`, and get
schemas with `model_json_schema()`.

## Async and provider calls

- `async def` for anything touching network or disk at scale; `httpx.AsyncClient`, not
  `requests`.
- Bound concurrency explicitly and comment the bound:

```python
sem = asyncio.Semaphore(20)  # provider allows 50 rpm; 20 leaves headroom for retries


async def fetch(client: httpx.AsyncClient, url: str) -> Response:
    async with sem:
        return await client.get(url)
```

- Retries on 429/5xx use exponential backoff and honour `Retry-After`. Cap the attempts.
- Streaming responses are async generators; always handle mid-stream termination.

## Errors

Specific exceptions, never bare `except:`. API-calling code is mostly error handling — treat
it as the main path, not an afterthought.

## Tests

`pytest`, with `pytest-asyncio` for async. Cover the failure modes that actually occur:
malformed JSON, missing fields, empty input, rate limits, interrupted streams. **No real
provider calls** — tests run offline, free, and deterministically.
