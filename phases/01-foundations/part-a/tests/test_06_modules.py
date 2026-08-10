"""Tests for topic 06 — Modules & structure."""

from __future__ import annotations

import json
import types
import xml

import pytest
from conftest import load_topic

t = load_topic("06_modules")


def test_parse_entry_point_splits_module_and_object() -> None:
    assert t.parse_entry_point("wrangle.cli:main") == ("wrangle.cli", "main")
    assert t.parse_entry_point("app:app") == ("app", "app")


def test_parse_entry_point_rejects_a_missing_colon() -> None:
    with pytest.raises(t.EntryPointError):
        t.parse_entry_point("wrangle.cli")


def test_parse_entry_point_rejects_extra_colons() -> None:
    # partition() would accept this by keeping "b:c" as the object name.
    with pytest.raises(t.EntryPointError):
        t.parse_entry_point("a:b:c")


def test_parse_entry_point_rejects_empty_halves() -> None:
    with pytest.raises(t.EntryPointError):
        t.parse_entry_point(":main")
    with pytest.raises(t.EntryPointError):
        t.parse_entry_point("wrangle.cli:")


def test_import_object_resolves_to_the_real_object() -> None:
    # `is`, not `==`: this must be the same function object, not a lookalike.
    assert t.import_object("json:loads") is json.loads


def test_import_object_handles_dotted_module_paths() -> None:
    assert t.import_object("json.decoder:JSONDecodeError") is json.JSONDecodeError


def test_import_object_reports_a_missing_module() -> None:
    with pytest.raises(t.EntryPointError):
        t.import_object("definitely_not_a_real_module_xyz:main")


def test_import_object_reports_a_missing_attribute() -> None:
    with pytest.raises(t.EntryPointError):
        t.import_object("json:not_a_real_function")


def test_import_object_chains_the_underlying_cause() -> None:
    with pytest.raises(t.EntryPointError) as info:
        t.import_object("json:not_a_real_function")
    assert isinstance(info.value.__cause__, AttributeError)


def test_public_names_prefers_dunder_all() -> None:
    module = types.ModuleType("fake")
    # setattr rather than `module.Apple = 1`: pyright knows ModuleType has no
    # such attribute and rejects the direct form. Building a module by hand is
    # exactly the situation the dynamic form is for.
    setattr(module, "__all__", ["Zebra", "Apple"])  # noqa: B010
    setattr(module, "Apple", 1)  # noqa: B010
    setattr(module, "Zebra", 2)  # noqa: B010
    setattr(module, "internal", 3)  # noqa: B010
    assert t.public_names(module) == ["Apple", "Zebra"]


def test_public_names_falls_back_to_the_underscore_convention() -> None:
    module = types.ModuleType("fake")
    setattr(module, "visible", 1)  # noqa: B010
    setattr(module, "_hidden", 2)  # noqa: B010
    names = t.public_names(module)
    assert "visible" in names
    assert "_hidden" not in names


def test_public_names_returns_sorted_output() -> None:
    module = types.ModuleType("fake")
    setattr(module, "__all__", ["c", "a", "b"])  # noqa: B010
    assert t.public_names(module) == ["a", "b", "c"]


def test_script_mode_detects_direct_execution() -> None:
    assert t.script_mode("__main__") == "script"


def test_script_mode_detects_import() -> None:
    assert t.script_mode("wrangle.cli") == "imported"


def test_module_names_in_package_lists_submodules() -> None:
    # xml is a small, stable stdlib package: dom, etree, parsers, sax.
    names = t.module_names_in_package(xml)
    assert "etree" in names
    assert names == sorted(names), "results must be sorted"


def test_module_names_in_package_returns_bare_names() -> None:
    names = t.module_names_in_package(xml)
    assert not any("." in name for name in names), "return 'etree', not 'xml.etree'"


def test_module_names_in_package_rejects_a_plain_module() -> None:
    # json.decoder is a module, not a package -- it has no __path__.
    with pytest.raises(t.EntryPointError):
        t.module_names_in_package(json.decoder)
