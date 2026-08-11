"""Export the Phase 1 Part A curriculum to JSON for the learning site.

The site under `site/` is a static Astro app, so it has no Python at runtime — but the
curriculum it teaches *is* Python: twelve drill modules, their pytest suites, and an answer
key. This script is the bridge. It reads the real files in
`phases/01-foundations/part-a/` and emits one JSON document the site imports at build time.

Why a Python script rather than a TypeScript parser in the Astro build: the input is Python
source, and `ast` is the only parser guaranteed to agree with the interpreter that will
later run it. A regex or hand-rolled TS parser would drift the moment a drill uses a
decorator, a nested class, or a multi-line signature.

Why generated rather than committed: `phases/` stays the single source of truth. The output
is gitignored and regenerated on every build, so it cannot go stale.

    uv run python scripts/export_curriculum.py

Output: site/src/generated/curriculum.json
"""

from __future__ import annotations

import ast
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PART_A = REPO_ROOT / "phases" / "01-foundations" / "part-a"
OUTPUT = REPO_ROOT / "site" / "src" / "generated" / "curriculum.json"

# Topic 11 is SQL: it needs a running Postgres, so it is self-assessed rather than graded
# by pytest. See part-a/README.md — "Topic 11 is not graded by pytest".
SQL_TOPIC_NUMBER = "11"

# `drills/dNN_x.py` is your work, `solutions/sNN_x.py` is the answer key. Same suffix,
# different prefix — the same convention conftest.py uses to swap one for the other.
IMPL_PREFIX = {"drills": "d", "solutions": "s"}

# Two blank lines between top-level definitions, as PEP 8 and ruff-format both want.
DEF_SEPARATOR = "\n\n\n"

# The one reliable marker of "this is your work". The drills flag exercises three
# different ways depending on what is being written:
#
#   raise NotImplementedError("Exercise 1.1")   most function bodies
#   # Exercise 7.1 — replace this line.         dataclass bodies (topic 07)
#   "Exercise 10.4. ..." in the docstring       type aliases with no body to stub
#
# Matching the shared "Exercise N.M" string catches all three, and its unique-ID count
# per topic agrees exactly with the drill counts in part-a/README.md. Detecting only
# NotImplementedError undercounts topics 07 and 10, which is how this was caught.
EXERCISE_ID = re.compile(r"Exercise (\d+\.\d+)")


# --------------------------------------------------------------------------------------
# Data model — plain dataclasses, serialised with `asdict`.
#
# Pydantic would be the repo default for validated boundaries, but this script owns both
# ends of this data: it constructs the objects and writes the file. There is nothing
# external to validate, so a dataclass carries the shape without adding a dependency.
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Exercise:
    """One unit of work inside a drill module — a function, class, or type alias."""

    name: str
    label: str
    kind: str
    signature: str
    docstring: str
    stub: str
    solution: str
    todo: bool
    tests: list[str]


@dataclass(frozen=True)
class SqlDrill:
    """One SQL drill: a numbered prompt and its reference query."""

    id: str
    title: str
    prompt: str
    solution: str


@dataclass
class Topic:
    """A Part A topic: the lesson identity plus everything needed to run its drills."""

    number: str
    id: str
    title: str
    lesson_slug: str
    graded: bool
    exercise_count: int
    test_count: int
    preamble: str = ""
    # The answer key's imports. Several topics leave an import out of the drill on
    # purpose — remembering `import functools` is part of exercise 9.1 — so the two
    # preambles genuinely differ, and the site needs both: the drill's to start the
    # learner off, the solution's to show alongside a revealed answer.
    solution_preamble: str = ""
    stub_source: str = ""
    solution_source: str = ""
    test_source: str = ""
    test_module: str = ""
    exercises: list[Exercise] = field(default_factory=list[Exercise])
    unmapped_tests: list[str] = field(default_factory=list[str])
    sql_drills: list[SqlDrill] = field(default_factory=list[SqlDrill])
    sql_files: dict[str, str] = field(default_factory=dict[str, str])


# --------------------------------------------------------------------------------------
# Parsing helpers
# --------------------------------------------------------------------------------------


def to_snake_case(name: str) -> str:
    """Convert a PascalCase identifier to snake_case.

    Needed because a class named `ModelRef` is exercised by tests named
    `test_model_ref_*`. Without this, topic 07's class-based drills lose their test
    mapping entirely.

    Args:
        name: An identifier, in any case.

    Returns:
        The snake_case form. Already-snake_case input is returned unchanged.
    """
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def definition_start_line(node: ast.stmt) -> int:
    """First source line of a statement, counting decorators.

    `node.lineno` on a decorated function points at the `def`, not at the `@`. Slicing
    from there would silently drop the decorator — which in topic 09, a decorators
    topic, would corrupt exactly the code being taught.

    Args:
        node: A top-level statement from a parsed module.

    Returns:
        The 1-indexed line where the statement's source truly begins.
    """
    decorators = getattr(node, "decorator_list", [])
    if decorators:
        return min(int(d.lineno) for d in decorators)
    return int(node.lineno)


def signature_of(node: ast.stmt, source_lines: list[str]) -> str:
    """Render a one-line signature for display above an exercise.

    Args:
        node: The definition to describe.
        source_lines: The module's source, split into lines.

    Returns:
        The `def ...:` or `class ...:` line, or the assignment for a type alias.
        Multi-line signatures are collapsed onto one line.
    """
    start = int(node.lineno) - 1
    end = int(node.end_lineno or node.lineno)
    text = " ".join(line.strip() for line in source_lines[start:end])
    head, _, _ = text.partition(":  #")
    if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
        head = text.split(":")[0] + ":" if ":" in text else text
        # Re-join a return annotation that the naive split above cut in half.
        if "->" in text:
            head = text[: text.rindex(":") + 1] if text.rstrip().endswith(":") else text
    return " ".join(head.split())


def is_exercise_target(node: ast.stmt) -> bool:
    """Is this top-level statement something a test could exercise?

    Functions, classes, and module-level assignments (topic 10's `Role = Literal[...]`
    type aliases are assignments, and they are graded).

    Args:
        node: A top-level statement.

    Returns:
        True if the statement defines a name tests may refer to.
    """
    if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
        return True
    if isinstance(node, ast.Assign):
        return any(isinstance(t, ast.Name) for t in node.targets)
    return isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name)


def name_of(node: ast.stmt) -> str:
    """The name a top-level statement binds.

    Args:
        node: A statement for which `is_exercise_target` returned True.

    Returns:
        The bound identifier.

    Raises:
        TypeError: if the node binds no single name.
    """
    if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
        return node.name
    if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
        return node.targets[0].id
    if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
        return node.target.id
    raise TypeError(f"cannot take a name from {type(node).__name__}")


@dataclass(frozen=True)
class ParsedModule:
    """A drill or solution module split into a preamble and per-definition segments."""

    preamble: str
    segments: dict[str, str]
    order: list[str]
    docstrings: dict[str, str]
    signatures: dict[str, str]
    kinds: dict[str, str]
    todos: dict[str, bool]


def parse_module(path: Path) -> ParsedModule:
    """Split a Python module into its preamble and one segment per top-level definition.

    The split is by line range rather than `ast.get_source_segment` so that comments and
    blank lines between definitions survive — in `solutions/` those comments are the
    teaching material, and dropping them would gut the answer key.

    Args:
        path: The module to parse.

    Returns:
        The parsed pieces, keyed by definition name.

    Raises:
        ValueError: if reassembling the pieces does not reproduce the original module.
    """
    source = path.read_text(encoding="utf-8")
    lines = source.splitlines()
    tree = ast.parse(source)

    targets = [node for node in tree.body if is_exercise_target(node)]
    if not targets:
        raise ValueError(f"{path} has no top-level definitions")

    preamble = "\n".join(lines[: definition_start_line(targets[0]) - 1]).strip()

    segments: dict[str, str] = {}
    order: list[str] = []
    docstrings: dict[str, str] = {}
    signatures: dict[str, str] = {}
    kinds: dict[str, str] = {}
    todos: dict[str, bool] = {}

    previous_end = definition_start_line(targets[0]) - 1
    for node in targets:
        name = name_of(node)
        end = int(node.end_lineno or node.lineno)
        # Span from wherever the previous definition ended, so interleaved comments and
        # blank lines stay attached to the definition they introduce.
        segment = "\n".join(lines[previous_end:end]).strip()
        previous_end = end

        segments[name] = segment
        order.append(name)
        signatures[name] = signature_of(node, lines)
        todos[name] = bool(EXERCISE_ID.search(segment))
        if isinstance(node, ast.ClassDef):
            kinds[name] = "class"
        elif isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            kinds[name] = "function"
        else:
            kinds[name] = "alias"
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
            docstrings[name] = ast.get_docstring(node) or ""
        else:
            docstrings[name] = ""

    # Trailing content after the last definition would be silently lost by the join
    # below, so prove the round-trip instead of assuming it.
    reassembled = preamble + DEF_SEPARATOR + DEF_SEPARATOR.join(segments[n] for n in order)
    if ast.dump(ast.parse(reassembled)) != ast.dump(tree):
        raise ValueError(
            f"{path}: reassembling the parsed segments did not reproduce the module. "
            "A definition is probably nested or separated in an unexpected way."
        )

    return ParsedModule(preamble, segments, order, docstrings, signatures, kinds, todos)


def collect_test_names(path: Path) -> list[str]:
    """Every top-level test function name in a pytest module, in source order.

    Args:
        path: The test module.

    Returns:
        The `test_*` function names.
    """
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return [
        node.name
        for node in tree.body
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
        and node.name.startswith("test_")
    ]


def map_tests_to_exercises(test_names: list[str], targets: list[str]) -> dict[str, list[str]]:
    """Group test names under the definition each one exercises.

    The drills name tests after what they test — `test_last_n_messages_with_zero...`
    covers `last_n_messages` — so the mapping is a longest-prefix match. Longest wins so
    that `parse_config_file` is preferred over `parse_config` when both exist.

    Args:
        test_names: Test function names from one topic's suite.
        targets: Definition names from the matching drill module.

    Returns:
        Definition name -> its test names. Tests matching nothing are left out; the
        caller reports them so a rename never silently loses coverage.
    """
    # One target can be reachable under several spellings: `ModelRef`, `modelref`,
    # `model_ref`. Map every spelling back to the canonical name.
    aliases: dict[str, str] = {}
    for target in targets:
        for spelling in (target, target.lower(), to_snake_case(target)):
            aliases[spelling] = target

    grouped: dict[str, list[str]] = {target: [] for target in targets}
    for test_name in test_names:
        stem = test_name.removeprefix("test_")
        matches = [alias for alias in aliases if stem == alias or stem.startswith(f"{alias}_")]
        if matches:
            grouped[aliases[max(matches, key=len)]].append(test_name)
    return grouped


# --------------------------------------------------------------------------------------
# Topic assembly
# --------------------------------------------------------------------------------------


def lesson_files() -> dict[str, Path]:
    """Map topic number to its lesson markdown file.

    Keyed by number rather than name because the two diverge: `d06_modules.py` pairs
    with `06-modules-and-structure.md`, and `d09_decorators.py` with
    `09-decorators-and-context-managers.md`.

    Returns:
        Topic number ("00".."11") -> lesson path.
    """
    lessons: dict[str, Path] = {}
    for path in sorted((PART_A / "lessons").glob("*.md")):
        number = path.stem.split("-", 1)[0]
        lessons[number] = path
    return lessons


def lesson_title(path: Path) -> str:
    """The lesson's display title, taken from its leading H1.

    Args:
        path: A lesson markdown file whose first heading is `# NN — Title`.

    Returns:
        The title with the numeric prefix stripped.

    Raises:
        ValueError: if the file has no H1.
    """
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            heading = line.removeprefix("# ").strip()
            # "01 — Core mechanics" -> "Core mechanics" (em dash, as the lessons use).
            _, separator, tail = heading.partition("—")
            return tail.strip() if separator else heading
    raise ValueError(f"{path} has no H1 heading to use as a title")


def build_graded_topic(number: str, lesson_path: Path) -> Topic:
    """Assemble one pytest-graded topic from its drill, solution, and test modules.

    Args:
        number: The zero-padded topic number.
        lesson_path: The matching lesson markdown file.

    Returns:
        The fully populated topic.

    Raises:
        FileNotFoundError: if the drill, solution, or test module is missing.
    """
    drill_paths = list((PART_A / "drills").glob(f"d{number}_*.py"))
    if not drill_paths:
        raise FileNotFoundError(f"no drill module for topic {number}")
    drill_path = drill_paths[0]
    topic_id = drill_path.stem.removeprefix("d")

    solution_path = PART_A / "solutions" / f"s{topic_id}.py"
    test_path = PART_A / "tests" / f"test_{topic_id}.py"
    for required in (solution_path, test_path):
        if not required.exists():
            raise FileNotFoundError(f"topic {number}: expected {required}")

    drill = parse_module(drill_path)
    solution = parse_module(solution_path)
    test_names = collect_test_names(test_path)
    grouped = map_tests_to_exercises(test_names, drill.order)

    exercises: list[Exercise] = []
    for name in drill.order:
        exercises.append(
            Exercise(
                name=name,
                # "Exercise 1.3" as written in the drill's NotImplementedError, so the
                # site's labels match what a learner sees in their editor.
                label=exercise_label(drill.segments[name], number, len(exercises) + 1),
                kind=drill.kinds[name],
                signature=drill.signatures[name],
                docstring=drill.docstrings[name],
                stub=drill.segments[name],
                solution=solution.segments.get(name, ""),
                todo=drill.todos[name],
                tests=grouped.get(name, []),
            )
        )

    mapped = {test for tests in grouped.values() for test in tests}
    return Topic(
        number=number,
        id=topic_id,
        title=lesson_title(lesson_path),
        lesson_slug=lesson_path.stem,
        graded=True,
        exercise_count=sum(1 for e in exercises if e.todo),
        test_count=len(test_names),
        preamble=drill.preamble,
        solution_preamble=solution.preamble,
        stub_source=drill_path.read_text(encoding="utf-8"),
        solution_source=solution_path.read_text(encoding="utf-8"),
        test_source=test_path.read_text(encoding="utf-8"),
        test_module=test_path.name,
        exercises=exercises,
        unmapped_tests=[t for t in test_names if t not in mapped],
    )


def exercise_label(segment: str, number: str, position: int) -> str:
    """The human label for an exercise, e.g. "Exercise 1.3".

    A definition may mention its ID more than once — `FixedTokenizer` raises
    `NotImplementedError("Exercise 7.5")` from two different methods — so the lowest ID
    present wins rather than the count of matches.

    Args:
        segment: The exercise's source, carrying one or more `Exercise N.M` markers.
        number: The zero-padded topic number, used for the fallback label.
        position: 1-indexed position in the module, used for the fallback label.

    Returns:
        The label from the marker when present, otherwise a derived one.
    """
    ids = EXERCISE_ID.findall(segment)
    if ids:
        return f"Exercise {min(ids, key=lambda i: tuple(int(p) for p in i.split('.')))}"
    return f"Exercise {int(number)}.{position}"


def parse_sql_drills() -> tuple[list[SqlDrill], dict[str, str]]:
    """Parse topic 11's SQL prompts and reference answers.

    Both files are sectioned by `-- 11.N  Title` comment headers, so one splitter serves
    them both.

    Returns:
        The drills in order, and the raw support files (schema, seed, compose) the site
        shows for setting the database up.
    """
    sql_dir = PART_A / "sql"
    header = re.compile(r"^--\s+(11\.\d+)\s+(.*)$", re.MULTILINE)

    def sections(path: Path) -> dict[str, tuple[str, str]]:
        text = path.read_text(encoding="utf-8")
        found = list(header.finditer(text))
        out: dict[str, tuple[str, str]] = {}
        for index, match in enumerate(found):
            end = found[index + 1].start() if index + 1 < len(found) else len(text)
            out[match.group(1)] = (match.group(2).strip(), text[match.end() : end].strip())
        return out

    prompts = sections(sql_dir / "drills.sql")
    answers = sections(sql_dir / "solutions.sql")

    drills = [
        SqlDrill(
            id=drill_id,
            title=title,
            # Strip the leading `-- ` so the site can render prose as prose.
            prompt="\n".join(
                line.removeprefix("--").strip() for line in body.splitlines() if line.strip()
            ),
            solution=answers.get(drill_id, ("", ""))[1],
        )
        for drill_id, (title, body) in prompts.items()
    ]

    support = {
        name: (sql_dir / name).read_text(encoding="utf-8")
        for name in ("schema.sql", "seed.sql", "docker-compose.yml")
    }
    return drills, support


def build_sql_topic(number: str, lesson_path: Path) -> Topic:
    """Assemble topic 11, which is self-assessed rather than pytest-graded.

    Args:
        number: The topic number, "11".
        lesson_path: The matching lesson markdown file.

    Returns:
        The topic, carrying SQL drills instead of Python exercises.
    """
    drills, support = parse_sql_drills()
    return Topic(
        number=number,
        id=f"{number}_a_little_sql",
        title=lesson_title(lesson_path),
        lesson_slug=lesson_path.stem,
        graded=False,
        exercise_count=len(drills),
        test_count=0,
        sql_drills=drills,
        sql_files=support,
    )


@dataclass(frozen=True)
class Runtime:
    """Files the browser needs verbatim to reproduce the pytest environment."""

    conftest: str
    drills_init: str


@dataclass(frozen=True)
class ExerciseSummary:
    """The little an exercise needs to appear in progress totals and navigation."""

    name: str
    label: str
    todo: bool
    test_count: int


@dataclass(frozen=True)
class TopicSummary:
    """A topic without its source code.

    The index every page loads. Full topics carry the drill, solution, and test source —
    around 350KB across the twelve — and the dashboard needs none of it to draw a progress
    bar. Splitting the export keeps that payload on the one page that actually runs code.
    """

    number: str
    id: str
    title: str
    lesson_slug: str
    graded: bool
    exercise_count: int
    test_count: int
    exercises: list[ExerciseSummary]


@dataclass(frozen=True)
class Curriculum:
    """The lightweight index, written to `curriculum.json`."""

    source: str
    topics: list[TopicSummary]


def summarise(topic: Topic) -> TopicSummary:
    """Reduce a topic to what the index needs.

    Args:
        topic: The fully loaded topic.

    Returns:
        Its summary, carrying no source code.
    """
    return TopicSummary(
        number=topic.number,
        id=topic.id,
        title=topic.title,
        lesson_slug=topic.lesson_slug,
        graded=topic.graded,
        exercise_count=topic.exercise_count,
        test_count=topic.test_count,
        exercises=[
            ExerciseSummary(
                name=exercise.name,
                label=exercise.label,
                todo=exercise.todo,
                test_count=len(exercise.tests),
            )
            for exercise in topic.exercises
        ],
    )


def build_topics() -> list[Topic]:
    """Load every Part A topic, in order.

    Returns:
        The twelve topics, complete with source code.
    """
    topics: list[Topic] = []
    for number, lesson_path in sorted(lesson_files().items()):
        if number == SQL_TOPIC_NUMBER:
            topics.append(build_sql_topic(number, lesson_path))
        else:
            topics.append(build_graded_topic(number, lesson_path))
    return topics


def build_runtime() -> Runtime:
    """The support files the in-browser pytest run needs.

    Returns:
        `conftest.py` and the drills package marker, shipped verbatim so the in-page run
        uses the same conftest — and therefore the same import machinery — as
        `uv run pytest`.
    """
    return Runtime(
        conftest=(PART_A / "conftest.py").read_text(encoding="utf-8"),
        drills_init=(PART_A / "drills" / "__init__.py").read_text(encoding="utf-8"),
    )


def camel_case_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
    """`asdict` factory that renames snake_case fields to camelCase.

    The dataclasses above are snake_case because they are Python; the consumer is
    TypeScript, where snake_case fields would look foreign in every component that
    touches them. Converting once here beats a translation layer on the other side, or
    naming Python fields in a style ruff's pep8-naming rules would reject.

    Args:
        pairs: Field name/value pairs for one dataclass, supplied by `asdict`.

    Returns:
        The same mapping with camelCase keys.
    """
    out: dict[str, object] = {}
    for key, value in pairs:
        head, *rest = key.split("_")
        out[head + "".join(word.title() for word in rest)] = value
    return out


def write_json(path: Path, value: object) -> int:
    """Serialise a dataclass tree to JSON with camelCase keys.

    Args:
        path: Destination file; parent directories are created.
        value: A dataclass instance.

    Returns:
        The number of bytes written.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(asdict(value, dict_factory=camel_case_keys), indent=2) + "\n"  # type: ignore[call-overload]
    path.write_text(text, encoding="utf-8")
    return len(text)


def main() -> int:
    """Write the curriculum index and per-topic detail files.

    Three outputs, split by who needs what:

      curriculum.json   the index — metadata only, loaded by every page
      runtime.json      conftest and the package marker, loaded by the test runner
      topics/<id>.json  one topic's source code, loaded only on its own lesson page

    Returns:
        0 on success, 1 if any test failed to map to an exercise. Failing loudly matters:
        an unmapped test is one whose result would never reach the UI, and a silent export
        would hide that behind a green build.
    """
    topics = build_topics()

    index = Curriculum(source="phases/01-foundations/part-a", topics=[summarise(t) for t in topics])
    index_bytes = write_json(OUTPUT, index)
    write_json(OUTPUT.parent / "runtime.json", build_runtime())

    detail_bytes = 0
    for topic in topics:
        detail_bytes += write_json(OUTPUT.parent / "topics" / f"{topic.id}.json", topic)

    problems = 0
    for topic in topics:
        if topic.unmapped_tests:
            problems += len(topic.unmapped_tests)
            print(
                f"  ! topic {topic.number}: unmapped tests {topic.unmapped_tests}",
                file=sys.stderr,
            )

    exercises = sum(topic.exercise_count for topic in topics)
    tests = sum(topic.test_count for topic in topics)
    relative = OUTPUT.parent.relative_to(REPO_ROOT)
    print(
        f"{relative}/: {len(topics)} topics, {exercises} exercises, {tests} tests "
        f"({index_bytes // 1024}KB index + {detail_bytes // 1024}KB lazy-loaded detail)"
    )

    if problems:
        print(f"{problems} test(s) could not be mapped to an exercise", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
