"""Tests for topic 09 — Decorators & context managers."""

from __future__ import annotations

import pytest
from conftest import load_topic

t = load_topic("09_decorators")


@pytest.fixture(autouse=True)
def clear_call_log() -> None:
    """Reset the module-level log before each test.

    `autouse=True` means every test in this file gets it without asking. This
    is itself the decorator-factory shape from exercise 9.2.
    """
    t.CALL_LOG.clear()


def test_logged_records_each_call() -> None:
    @t.logged
    def fetch(name: str) -> str:
        return f"got {name}"

    fetch("a")
    fetch("b")
    assert t.CALL_LOG == ["fetch", "fetch"]


def test_logged_returns_the_wrapped_result() -> None:
    @t.logged
    def fetch(name: str) -> str:
        return f"got {name}"

    assert fetch("thing") == "got thing"


def test_logged_forwards_positional_and_keyword_arguments() -> None:
    @t.logged
    def join(a: str, b: str, sep: str = "-") -> str:
        return f"{a}{sep}{b}"

    assert join("x", b="y", sep="+") == "x+y"


def test_logged_preserves_function_metadata() -> None:
    # Without functools.wraps this is "wrapper", which breaks pytest's
    # name-based test discovery and FastAPI's generated OpenAPI docs.
    @t.logged
    def fetch(name: str) -> str:
        """Fetch a thing."""
        return name

    assert fetch.__name__ == "fetch", "use functools.wraps"
    assert fetch.__doc__ == "Fetch a thing."


def test_default_on_error_returns_the_default_on_value_error() -> None:
    @t.default_on_error("unknown")
    def parse(raw: str) -> str:
        raise ValueError(raw)

    assert parse("bad") == "unknown"


def test_default_on_error_passes_success_through() -> None:
    @t.default_on_error("unknown")
    def parse(raw: str) -> str:
        return raw.upper()

    assert parse("ok") == "OK"


def test_default_on_error_does_not_swallow_other_exceptions() -> None:
    @t.default_on_error("unknown")
    def parse(raw: str) -> str:
        raise TypeError("a real bug")

    with pytest.raises(TypeError):
        parse("anything")


def test_default_on_error_preserves_metadata() -> None:
    @t.default_on_error("unknown")
    def parse(raw: str) -> str:
        return raw

    assert parse.__name__ == "parse"


def test_memoized_runs_the_function_once_per_input() -> None:
    calls: list[str] = []

    @t.memoized
    def expensive(arg: str) -> str:
        calls.append(arg)
        return arg.upper()

    assert expensive("a") == "A"
    assert expensive("a") == "A"
    assert expensive("b") == "B"
    assert calls == ["a", "b"], "the second call with 'a' should hit the cache"


def test_memoized_caches_falsy_results() -> None:
    # A cached "" is falsy. `if not cache.get(arg)` would recompute it forever.
    calls: list[str] = []

    @t.memoized
    def blank(arg: str) -> str:
        calls.append(arg)
        return ""

    blank("a")
    blank("a")
    assert calls == ["a"]


def test_memoized_caches_are_independent_per_decoration() -> None:
    @t.memoized
    def first(arg: str) -> str:
        return "first"

    @t.memoized
    def second(arg: str) -> str:
        return "second"

    assert first("x") == "first"
    assert second("x") == "second", "each decorated function needs its own cache"


def test_collecting_yields_a_usable_list() -> None:
    with t.collecting() as items:
        items.append("a")
        items.append("b")
        assert items == ["a", "b"]


def test_collecting_runs_teardown_after_the_block() -> None:
    with t.collecting() as items:
        items.append("a")
    assert items == ["a", "closed"]


def test_collecting_runs_teardown_when_the_body_raises() -> None:
    captured: list[str] = []
    with pytest.raises(RuntimeError), t.collecting() as items:
        captured = items
        items.append("a")
        raise RuntimeError("boom")
    assert captured == ["a", "closed"], "wrap the yield in try/finally"


def test_guarded_records_enter_and_exit() -> None:
    events: list[str] = []
    with t.guarded(events):
        events.append("body")
    assert events == ["enter", "body", "exit"]


def test_guarded_records_exit_when_the_body_raises() -> None:
    # The exception is thrown INTO the generator at the yield. Without
    # try/finally the teardown is simply never reached.
    events: list[str] = []
    with pytest.raises(RuntimeError, match="boom"), t.guarded(events):
        raise RuntimeError("boom")
    assert events == ["enter", "exit"]


def test_suppressing_swallows_value_error() -> None:
    events: list[str] = []
    # No pytest.raises here: the ValueError must not escape the with block.
    with t.suppressing(events):
        raise ValueError("handled")
    assert events == ["enter", "exit"]


def test_suppressing_passes_other_exceptions_through() -> None:
    events: list[str] = []
    with pytest.raises(TypeError), t.suppressing(events):
        raise TypeError("not handled")
    assert events == ["enter", "exit"]


def test_suppressing_on_the_success_path() -> None:
    events: list[str] = []
    with t.suppressing(events):
        events.append("body")
    assert events == ["enter", "body", "exit"]
