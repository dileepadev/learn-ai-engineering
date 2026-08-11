"""Runs a Part A pytest suite inside Pyodide and returns structured results.

Loaded as raw text by `pyodide.worker.ts` and executed once at boot; `run_suite` is then
called per test run. It also backs `scripts/verify-drills.mjs`, so the code the browser
runs is the code the regression test exercises — the two cannot drift.

This is not a reimplementation of pytest. It is a thin wrapper that (a) makes the module
cache safe to re-run, and (b) turns reports into JSON the UI can render as a checklist
instead of a wall of terminal output.
"""

import importlib
import io
import json
import os
import sys
from contextlib import redirect_stderr, redirect_stdout

import pytest

PART_A = "/part-a"

# The same switch conftest.py reads. The site always grades the learner's own work; the
# "solutions" setting exists for the verification script.
os.environ.setdefault("DRILLS_IMPL", "drills")

if PART_A not in sys.path:
    sys.path.insert(0, PART_A)


class ResultCollector:
    """Records one row per test, plus any collection-time failure."""

    def __init__(self):
        self.results = []
        self.collect_error = None

    def pytest_runtest_logreport(self, report):
        # One row per test. Setup and teardown only matter when they fail, which is how
        # a broken fixture surfaces instead of silently producing no row at all.
        if report.when == "call" or (report.when in ("setup", "teardown") and report.failed):
            self.results.append(
                {
                    "name": report.nodeid.split("::")[-1],
                    "outcome": report.outcome,
                    "message": str(report.longrepr) if report.failed else "",
                }
            )

    def pytest_collectreport(self, report):
        # A syntax error in the learner's code fails collection, so no test runs at all.
        # Without capturing this the UI would show an empty list and no explanation.
        if report.failed:
            self.collect_error = str(report.longrepr)


def _evict_stale_modules():
    """Drop imported drill, solution, conftest, and test modules.

    pytest leaves the modules it imports in `sys.modules`. Without this, the second run
    after an edit re-tests the *previous* version of the code — which would be the most
    confusing possible bug in a tool whose entire job is telling you whether your latest
    edit works.
    """
    for name in list(sys.modules):
        if name == "conftest" or name.startswith(("drills", "solutions", "test_")):
            del sys.modules[name]
    importlib.invalidate_caches()


def run_suite(test_module):
    """Run one topic's suite.

    Args:
        test_module: Filename of the test module, e.g. `test_01_core_mechanics.py`.

    Returns:
        A JSON string with the exit code, any collection error, per-test results, and the
        captured terminal output.
    """
    _evict_stale_modules()
    collector = ResultCollector()
    buffer = io.StringIO()

    os.chdir(PART_A)
    with redirect_stdout(buffer), redirect_stderr(buffer):
        exit_code = pytest.main(
            [
                "-p",
                "no:cacheprovider",
                "-q",
                "--no-header",
                "--tb=short",
                "-W",
                "ignore::DeprecationWarning",
                f"{PART_A}/tests/{test_module}",
            ],
            plugins=[collector],
        )

    return json.dumps(
        {
            "exitCode": int(exit_code),
            "collectError": collector.collect_error,
            "results": collector.results,
            "output": buffer.getvalue(),
        }
    )
