"""Shared pytest configuration for the Part A drills.

Two jobs:

1. Being here at all puts `part-a/` on `sys.path`, so `import drills` and
   `import solutions` resolve. pytest prepends the directory containing the
   nearest `conftest.py` — that is the whole mechanism, there is no magic.

2. It exposes the `impl` fixture below, which decides *which* implementation the
   tests run against.

Why a fixture instead of `from drills import ...` at the top of each test file:
the same test suite has to serve two purposes. Normally it grades your work in
`drills/`. But the answer key in `solutions/` needs to be proven correct too —
otherwise it is just a file someone claims is right. One environment variable
repoints every test:

    uv run pytest phases/01-foundations/part-a
    DRILLS_IMPL=solutions uv run pytest phases/01-foundations/part-a

This is the same idea as `mockstream`, the Phase 1 main project: swap the real
thing for a stand-in at the boundary, and the code under test never notices.
"""

from __future__ import annotations

import importlib
import os
from types import ModuleType

import pytest

# "drills" (your work) or "solutions" (the answer key). Set via DRILLS_IMPL.
IMPL_PACKAGE = os.environ.get("DRILLS_IMPL", "drills")

# drills/d04_errors.py <-> solutions/s04_errors.py — same suffix, different prefix,
# so one topic number maps to one module in whichever package is selected.
_MODULE_PREFIX = {"drills": "d", "solutions": "s"}


@pytest.fixture(scope="session")
def impl() -> ModuleType:
    """The selected implementation package (`drills` by default).

    Returns:
        The imported package module. Test modules use `load_topic` instead of
        this fixture directly; it exists so a test can assert on the package.

    Raises:
        ValueError: if DRILLS_IMPL is set to something other than
            "drills" or "solutions".
    """
    if IMPL_PACKAGE not in _MODULE_PREFIX:
        raise ValueError(f"DRILLS_IMPL must be 'drills' or 'solutions', got {IMPL_PACKAGE!r}")
    return importlib.import_module(IMPL_PACKAGE)


def load_topic(topic: str) -> ModuleType:
    """Import one topic module from whichever implementation is selected.

    Called at import time by each test module, e.g. `load_topic("04_errors")`
    resolves to `drills.d04_errors` or `solutions.s04_errors`.

    Args:
        topic: The topic suffix, e.g. "01_core_mechanics".

    Returns:
        The imported topic module.

    Raises:
        ValueError: if DRILLS_IMPL names an unknown package.
    """
    prefix = _MODULE_PREFIX.get(IMPL_PACKAGE)
    if prefix is None:
        raise ValueError(f"DRILLS_IMPL must be 'drills' or 'solutions', got {IMPL_PACKAGE!r}")
    return importlib.import_module(f"{IMPL_PACKAGE}.{prefix}{topic}")
