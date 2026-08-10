# 06 — Modules & structure

> **Drill:** `drills/d06_modules.py` · **Test:** `uv run pytest phases/01-foundations/part-a/tests/test_06_modules.py`

Every phase project in this repo is a package with a `src/` layout and an entry point. This
topic explains what those words mean and why the layout is not arbitrary — then drills the one
piece of import machinery you will actually use directly, which is dynamic import.

## Module, package, distribution

- A **module** is one `.py` file. `clean.py` is a module named `clean`.
- A **package** is a directory containing `__init__.py`. It is a module that holds modules.
- A **distribution** is what you install — `projects/01-wrangle/` builds a distribution named
  `wrangle` that contains the package `wrangle`.

These three are routinely conflated, including by error messages. Keeping them apart makes
`ModuleNotFoundError` far less mysterious: it is always about the first two, never the third.

## The `src/` layout, and why AGENTS.md requires it

Two ways to lay out a project:

```text
flat layout                     src layout  (this repo)
wrangle/                        projects/01-wrangle/
├── wrangle/                    ├── pyproject.toml
│   └── __init__.py             ├── src/
├── tests/                      │   └── wrangle/
└── pyproject.toml              │       └── __init__.py
                                └── tests/
```

In the flat layout, the package directory sits next to your tests, in the current working
directory — which Python puts on `sys.path` automatically. So `import wrangle` finds your
source files whether or not the package is actually installed.

That sounds convenient and is a trap. Your tests pass against the source tree, then the
installed wheel is missing a data file or a subpackage you forgot to declare, and you find out
in production. The `src/` layout makes that impossible: `src/` is not on `sys.path`, so
`import wrangle` can only resolve to the *installed* package. You are always testing what you
ship.

`uv sync` installs workspace members in editable mode, so edits still take effect immediately.
You get the safety without the round trip.

## Absolute imports only

```python
from wrangle.models import Bookmark  # absolute — AGENTS.md requires this
from .models import Bookmark  # relative — do not use here
```

Relative imports break when a module is run directly, and they make it impossible to tell
where a name came from without knowing which file you are in. Absolute imports are longer and
unambiguous. That trade is worth it in a repo meant to be read.

## `__init__.py` and `__all__`

`__init__.py` runs when the package is imported. Two legitimate uses:

```python
# src/wrangle/__init__.py
from wrangle.models import Bookmark, Collection

__all__ = ["Bookmark", "Collection"]
```

This defines the package's public surface — callers write `from wrangle import Bookmark`
without knowing it lives in `models.py`. `__all__` declares what `from wrangle import *`
exports, and more usefully documents intent to readers and linters.

Keep `__init__.py` cheap. Anything slow there — reading a config file, opening a connection —
runs on import, which means it runs during test collection, during `--help`, and during
autocomplete in your editor.

## Entry points

```toml
[project.scripts]
wrangle = "wrangle.cli:main"
```

That string is the whole mechanism: **`module.path:function_name`**. Installing the package
generates a small executable named `wrangle` that imports `wrangle.cli` and calls `main()`.
That is how `uv run wrangle input.json` works, and there is nothing more to it.

The same `module:function` syntax appears in `uvicorn app.main:app` in Phase 1's `mockstream`,
and in plugin registries throughout Python. Learning to parse and resolve it — drills 6.1 and
6.2 — is learning how a whole category of tooling works.

## `if __name__ == "__main__"`

```python
def main() -> None: ...


if __name__ == "__main__":
    main()
```

`__name__` is `"__main__"` when the file is run directly (`python clean.py`) and the module's
own name (`"wrangle.clean"`) when it is imported. The guard means "only do this when run as a
script."

Without it, importing the module *executes* it. A test that imports your CLI module would run
the CLI. This is the reason the guard exists, and the reason it is a convention rather than a
preference.

## Dynamic import

```python
import importlib

module = importlib.import_module("json")  # same as `import json`, name from a variable
loads = getattr(module, "loads")  # same as `json.loads`
```

You need this whenever the name is data rather than source code: resolving an entry point,
loading a plugin, letting a config file name a strategy class. The `conftest.py` in this very
directory uses `importlib.import_module` to choose between `drills` and `solutions` — go read
it — it is mostly comment, and the mechanism will now make sense.

In Phase 5, an agent's tool registry does exactly this: the model returns a tool *name* as a
string, and you resolve it to a callable.

## Where this shows up later

- **Phase 1** — both projects are `src/` packages with `[project.scripts]` entry points.
- **Phase 1 `mockstream`** — `uvicorn mockstream.app:app` is the same `module:object` syntax.
- **Phase 5** — dynamic dispatch from a model-supplied tool name to a Python function.

## Do the drills

`drills/d06_modules.py`. Five functions, all about resolving names to objects — the mechanism
underneath entry points, plugins, and agent tool registries.
