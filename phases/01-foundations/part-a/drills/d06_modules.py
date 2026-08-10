"""Topic 06 — Modules & structure.

Read `lessons/06-modules-and-structure.md` first.

    uv run pytest phases/01-foundations/part-a/tests/test_06_modules.py
"""

from __future__ import annotations

from types import ModuleType


class EntryPointError(Exception):
    """Raised when an entry-point specification cannot be parsed or resolved."""


def parse_entry_point(spec: str) -> tuple[str, str]:
    """Split an entry-point string into its module path and object name.

    This is the syntax in `[project.scripts]`, in `uvicorn app.main:app`, and
    in most Python plugin systems:

        "wrangle.cli:main"  ->  ("wrangle.cli", "main")

    Reject anything that is not exactly one module path, one colon, and one
    object name — including "wrangle.cli" (no colon), "a:b:c" (two colons),
    and ":main" or "wrangle.cli:" (an empty half).

    Args:
        spec: The entry-point string.

    Returns:
        A (module_path, object_name) pair.

    Raises:
        EntryPointError: If `spec` is not a well-formed entry point.
    """
    raise NotImplementedError("Exercise 6.1")


def import_object(spec: str) -> object:
    """Resolve an entry-point string to the actual Python object.

    Build on `parse_entry_point`, then use `importlib.import_module` and
    `getattr`. `import_object("json:loads")` must return the real
    `json.loads` function — the same object, not a copy or a wrapper.

    This is what an installed console script does, and what a Phase 5 agent
    does when the model names a tool.

    Args:
        spec: An entry-point string like "json:loads".

    Returns:
        The resolved object.

    Raises:
        EntryPointError: If the spec is malformed, the module does not exist,
            or the module has no such attribute. Chain from the underlying
            ImportError or AttributeError with `from exc`.
    """
    raise NotImplementedError("Exercise 6.2")


def public_names(module: ModuleType) -> list[str]:
    """List a module's public names, respecting `__all__`.

    The rule Python itself uses for `from module import *`:
      - if the module defines `__all__`, that IS the answer (sorted here)
      - otherwise, every top-level name not starting with an underscore, sorted

    Args:
        module: An imported module.

    Returns:
        The public names, sorted alphabetically.
    """
    raise NotImplementedError("Exercise 6.3")


def script_mode(module_name: str) -> str:
    """Report whether a module was run directly or imported.

    Callers pass their own `__name__`. Python sets that to "__main__" for the
    file being executed and to the module's real dotted name otherwise — which
    is the entire mechanism behind `if __name__ == "__main__":`.

    Args:
        module_name: The caller's `__name__`.

    Returns:
        "script" if run directly, otherwise "imported".
    """
    raise NotImplementedError("Exercise 6.4")


def module_names_in_package(package: ModuleType) -> list[str]:
    """List the importable module names directly inside a package.

    Use `pkgutil.iter_modules` against the package's `__path__`. Return bare
    names ("clean", "models"), not dotted paths, sorted alphabetically.

    A module passed instead of a package has no `__path__` — that is a caller
    error, not an empty result.

    Args:
        package: An imported package (a module with a `__path__`).

    Returns:
        Sorted names of the modules and subpackages directly inside it.

    Raises:
        EntryPointError: If `package` is a plain module, not a package.
    """
    raise NotImplementedError("Exercise 6.5")
