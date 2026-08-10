"""Topic 06 — Modules & structure: reference solutions."""

from __future__ import annotations

import importlib
import pkgutil
from types import ModuleType


class EntryPointError(Exception):
    """Raised when an entry-point specification cannot be parsed or resolved."""


def parse_entry_point(spec: str) -> tuple[str, str]:
    """Split an entry-point string into its module path and object name."""
    # str.partition would silently accept "a:b:c" by keeping "b:c" as the name.
    # split(":") plus a length check rejects it, which is what we want -- a
    # malformed pyproject entry should fail at parse time, not at call time.
    parts = spec.split(":")
    if len(parts) != 2:
        raise EntryPointError(f"entry point must be 'module:object', got {spec!r}")

    module_path, object_name = parts
    if not module_path or not object_name:
        raise EntryPointError(f"entry point has an empty half: {spec!r}")

    return module_path, object_name


def import_object(spec: str) -> object:
    """Resolve an entry-point string to the actual Python object."""
    module_path, object_name = parse_entry_point(spec)

    try:
        module = importlib.import_module(module_path)
    except ImportError as exc:
        # Chained so the original "No module named 'x'" survives -- that message
        # already distinguishes a typo from a genuinely missing dependency.
        raise EntryPointError(f"cannot import module {module_path!r}") from exc

    try:
        return getattr(module, object_name)
    except AttributeError as exc:
        raise EntryPointError(f"module {module_path!r} has no attribute {object_name!r}") from exc


def public_names(module: ModuleType) -> list[str]:
    """List a module's public names, respecting `__all__`."""
    declared = getattr(module, "__all__", None)
    if declared is not None:
        # An explicit __all__ is the author's stated public API. Honour it even
        # if it lists names that look private -- that was a deliberate choice.
        return sorted(declared)

    # vars() is the module's namespace dict. The leading-underscore convention
    # is all Python has for "private"; there is no enforcement anywhere.
    return sorted(name for name in vars(module) if not name.startswith("_"))


def script_mode(module_name: str) -> str:
    """Report whether a module was run directly or imported."""
    return "script" if module_name == "__main__" else "imported"


def module_names_in_package(package: ModuleType) -> list[str]:
    """List the importable module names directly inside a package."""
    # __path__ is what makes a package a package: it is the list of directories
    # to search for submodules. Plain modules simply do not have it.
    package_path = getattr(package, "__path__", None)
    if package_path is None:
        raise EntryPointError(f"{package.__name__!r} is a module, not a package")

    # iter_modules lists what is importable without importing any of it --
    # importing every submodule just to enumerate them would run their side effects.
    return sorted(info.name for info in pkgutil.iter_modules(package_path))
