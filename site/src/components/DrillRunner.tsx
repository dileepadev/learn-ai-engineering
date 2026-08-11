import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor.tsx";
import { InlineMarkdown } from "./InlineMarkdown.tsx";
import { useProgress } from "../lib/useProgress.ts";
import { clearDraft, saveDraft, setExerciseResult } from "../lib/progress.ts";
import { exerciseKey, workableExercises } from "../lib/curriculum.ts";
import { loadTopicDetail, type Exercise, type TopicDetail } from "../lib/topicDetail.ts";
import {
  getStatus,
  PREAMBLE_KEY,
  runTopic,
  subscribeStatus,
  warm,
  type RunnerStatus,
  type TestResult,
} from "../lib/runner.ts";

interface DrillRunnerProps {
  topicId: string;
}

/** Prettify `test_last_n_messages_with_zero_returns_nothing` for display. */
function humanizeTest(name: string): string {
  return name.replace(/^test_/, "").replace(/_/g, " ");
}

function useRunnerStatus(): RunnerStatus {
  const [status, setStatus] = useState<RunnerStatus>(() => getStatus());
  useEffect(() => subscribeStatus(setStatus), []);
  return status;
}

/**
 * The interactive half of a lesson page: every exercise in the topic, with a real editor
 * and the topic's real pytest suite.
 *
 * One run executes the whole suite, then results are split per exercise using the
 * test-to-exercise map built at export time. That is why finishing one drill can turn
 * several rows green at once, and why the summary at the top is always truthful.
 */
export function DrillRunner({ topicId }: DrillRunnerProps) {
  const state = useProgress();
  const status = useRunnerStatus();

  // The topic's source code is a separate chunk, fetched when this component mounts —
  // which `client:visible` delays until the drills are actually scrolled to.
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTopicDetail(topicId)
      .then((detail) => {
        if (!cancelled) setTopic(detail);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const [code, setCode] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{ passed: number; total: number; ms: number } | null>(null);
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const hydratedDrafts = useRef(false);

  const exercises = useMemo(() => (topic ? workableExercises(topic) : []), [topic]);

  // Seed each editor from the saved draft, falling back to the stub. Runs once, after the
  // progress store has hydrated — seeding on every render would overwrite live typing.
  useEffect(() => {
    if (!topic || hydratedDrafts.current) return;
    hydratedDrafts.current = true;
    const seeded: Record<string, string> = {
      [PREAMBLE_KEY]:
        state.exercises[exerciseKey(topic.id, PREAMBLE_KEY)]?.draft ?? topic.preamble,
    };
    for (const exercise of topic.exercises) {
      seeded[exercise.name] =
        state.exercises[exerciseKey(topic.id, exercise.name)]?.draft ?? exercise.stub;
    }
    setCode(seeded);
    setOpenExercise(
      exercises.find((e) => !state.exercises[exerciseKey(topic.id, e.name)]?.passed)?.name ??
        exercises[0]?.name ??
        null,
    );
  }, [topic, state, exercises]);

  // Start Pyodide downloading once the topic is known, so the runtime is warm by the time
  // the learner has read the lesson and scrolled down here.
  //
  // Only for graded topics: topic 11 is SQL and has no Python drills at all, so warming
  // there would pull ~10MB of runtime the page can never use.
  const needsPython = topic?.graded ?? false;
  useEffect(() => {
    if (!needsPython) return;
    const idle = window.requestIdleCallback?.(() => warm()) ?? window.setTimeout(warm, 1500);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [needsPython]);

  const updateCode = useCallback(
    (exercise: Exercise, next: string) => {
      if (!topic) return;
      setCode((current) => ({ ...current, [exercise.name]: next }));
      saveDraft(exerciseKey(topic.id, exercise.name), next);
    },
    [topic],
  );

  const run = useCallback(async () => {
    if (!topic) return;
    setRunError(null);
    try {
      const outcome = await runTopic(topic, code);

      const byName: Record<string, TestResult> = {};
      for (const result of outcome.results) byName[result.name] = result;
      setResults(byName);

      // An exercise passes when every test mapped to it passes — and it must have at
      // least one, or an exercise with no coverage would count as done for free.
      for (const exercise of topic.exercises) {
        if (exercise.tests.length === 0) continue;
        const passed = exercise.tests.every((test) => byName[test]?.outcome === "passed");
        setExerciseResult(exerciseKey(topic.id, exercise.name), passed);
      }

      const passedCount = outcome.results.filter((r) => r.outcome === "passed").length;
      setLastRun({ passed: passedCount, total: outcome.results.length, ms: outcome.durationMs });
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
      setLastRun(null);
    }
  }, [topic, code]);

  if (loadError) {
    return (
      <section id="drills" className="mt-16 scroll-mt-20 rounded-xl border border-line bg-raised p-5">
        <h2 className="text-lg font-semibold">Drills could not be loaded</h2>
        <p className="mt-1 text-sm text-muted">{loadError}</p>
      </section>
    );
  }

  if (!topic) {
    return (
      <section id="drills" className="mt-16 scroll-mt-20">
        <div className="h-7 w-32 animate-pulse rounded bg-sunken" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-16 animate-pulse rounded-xl bg-sunken" />
          ))}
        </div>
      </section>
    );
  }

  if (!topic.graded) return <SqlDrills topic={topic} />;

  const busy = status.kind === "running" || status.kind === "booting";
  const passedExercises = exercises.filter(
    (exercise) => state.exercises[exerciseKey(topic.id, exercise.name)]?.passed,
  ).length;

  return (
    <section id="drills" className="mt-16 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Drills</h2>
          <p className="mt-1 text-sm text-muted">
            {exercises.length} exercises, graded by the topic's real pytest suite — running
            here, in this tab.
          </p>
        </div>
        <span className="rounded-full bg-sunken px-3 py-1 text-sm font-medium tabular-nums">
          {passedExercises} / {exercises.length} passing
        </span>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-5 border-y border-line bg-surface/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-lg sm:border sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {status.kind === "booting" ? "Starting Python…" : busy ? "Running…" : "Run tests"}
          </button>

          <span className="text-xs text-faint">
            or press <kbd className="rounded border border-line bg-sunken px-1.5 py-0.5 font-mono">⌘/Ctrl</kbd>
            {" + "}
            <kbd className="rounded border border-line bg-sunken px-1.5 py-0.5 font-mono">Enter</kbd>
          </span>

          {status.kind === "booting" ? (
            <span className="text-xs text-muted">{status.detail}</span>
          ) : null}

          {lastRun ? (
            <span
              className={`ml-auto text-sm font-medium tabular-nums ${
                lastRun.passed === lastRun.total ? "text-done" : "text-muted"
              }`}
            >
              {lastRun.passed}/{lastRun.total} tests passed · {lastRun.ms}ms
            </span>
          ) : null}
        </div>

        {runError ? (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/8 p-3">
            <p className="text-sm font-medium text-red-500">
              Your code could not be imported — usually a syntax error.
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted">
              {runError}
            </pre>
          </div>
        ) : null}
      </div>

      <ModuleSetup
        value={code[PREAMBLE_KEY] ?? topic.preamble}
        original={topic.preamble}
        onChange={(next) => {
          setCode((current) => ({ ...current, [PREAMBLE_KEY]: next }));
          saveDraft(exerciseKey(topic.id, PREAMBLE_KEY), next);
        }}
        onRun={() => void run()}
      />

      <ol className="mt-4 space-y-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.name}
            topic={topic}
            exercise={exercise}
            code={code[exercise.name] ?? exercise.stub}
            results={results}
            passed={Boolean(state.exercises[exerciseKey(topic.id, exercise.name)]?.passed)}
            open={openExercise === exercise.name}
            onToggle={() =>
              setOpenExercise((current) => (current === exercise.name ? null : exercise.name))
            }
            onChange={(next) => updateCode(exercise, next)}
            onRun={() => void run()}
          />
        ))}
      </ol>
    </section>
  );
}

interface ModuleSetupProps {
  value: string;
  original: string;
  onChange: (next: string) => void;
  onRun: () => void;
}

/**
 * The module's imports, editable.
 *
 * Not decoration. Several drills leave an import out on purpose — topic 09 expects you to
 * reach for `functools.wraps`, topic 08 for `itertools.islice`, topic 07 for
 * `dataclasses.field` — so remembering the import is part of the exercise. Without this
 * panel those topics would be impossible to finish in the browser.
 *
 * Collapsed by default, because most topics need no change here.
 */
function ModuleSetup({ value, original, onChange, onRun }: ModuleSetupProps) {
  const [open, setOpen] = useState(false);
  const edited = value !== original;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-raised">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-sunken"
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Module setup — imports</span>
          <span className="block text-xs text-muted">
            Some drills need an import that isn't here yet. Adding it is part of the exercise.
          </span>
        </span>
        {edited ? (
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
            edited
          </span>
        ) : null}
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="border-t border-line bg-sunken/30">
          <CodeEditor
            value={value}
            onChange={onChange}
            onRun={onRun}
            ariaLabel="Module imports and setup"
          />
        </div>
      ) : null}
    </div>
  );
}

interface ExerciseCardProps {
  topic: TopicDetail;
  exercise: Exercise;
  code: string;
  results: Record<string, TestResult>;
  passed: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (next: string) => void;
  onRun: () => void;
}

function ExerciseCard({
  topic,
  exercise,
  code,
  results,
  passed,
  open,
  onToggle,
  onChange,
  onRun,
}: ExerciseCardProps) {
  const [showSolution, setShowSolution] = useState(false);
  const key = exerciseKey(topic.id, exercise.name);

  const testRows = exercise.tests.map((name) => ({ name, result: results[name] }));
  const ran = testRows.some((row) => row.result);
  const failing = testRows.filter((row) => row.result && row.result.outcome !== "passed");

  return (
    <li
      className={`overflow-hidden rounded-xl border bg-raised transition-colors ${
        passed ? "border-done/40" : "border-line"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-sunken"
      >
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
            passed ? "bg-done text-white" : "bg-sunken text-faint"
          }`}
        >
          {passed ? (
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
              <path d="M4 12.5l5.5 5.5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-faint">{exercise.label}</span>
          <code className="block truncate font-mono text-sm">{exercise.name}</code>
        </span>

        <span className="shrink-0 text-xs tabular-nums text-faint">
          {exercise.tests.length} test{exercise.tests.length === 1 ? "" : "s"}
        </span>

        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="border-t border-line">
          {exercise.docstring ? (
            <div className="border-b border-line bg-sunken/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-faint">The spec</p>
              {/*
                The docstring is the specification, written for a reader with a terminal —
                so it arrives with `backticks` intact and its own line breaks. `whitespace-pre-wrap`
                keeps the layout the author intended; InlineMarkdown renders the code spans
                rather than showing the backticks raw.
              */}
              <div className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-muted">
                <InlineMarkdown text={exercise.docstring} />
              </div>
            </div>
          ) : null}

          <div className="bg-sunken/30">
            <CodeEditor
              value={showSolution ? exercise.solution : code}
              onChange={onChange}
              onRun={onRun}
              ariaLabel={`Code editor for ${exercise.name}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                onChange(exercise.stub);
                clearDraft(key);
                setShowSolution(false);
              }}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              Reset to stub
            </button>

            <button
              type="button"
              onClick={() => setShowSolution((current) => !current)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              {showSolution ? "Back to my code" : "Show solution"}
            </button>

            {showSolution ? (
              <span className="text-xs text-faint">
                Read-only preview — the answer key is commented with the reasoning.
              </span>
            ) : null}
          </div>

          <div className="border-t border-line px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">
              {ran ? "Results" : "Tests for this exercise"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {testRows.map(({ name, result }) => (
                <li key={name} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1 shrink-0" aria-hidden="true">
                    {!result ? (
                      <span className="block size-2 rounded-full bg-line-strong" />
                    ) : result.outcome === "passed" ? (
                      <svg viewBox="0 0 24 24" className="size-3.5 text-done" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <path d="M4 12.5l5.5 5.5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <span className={result?.outcome === "passed" ? "text-muted" : ""}>
                    {humanizeTest(name)}
                  </span>
                </li>
              ))}
            </ul>

            {failing.length > 0 ? (
              <details className="mt-3 rounded-lg border border-line bg-sunken/60" open>
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted">
                  Why it failed
                </summary>
                <pre className="max-h-64 overflow-auto border-t border-line px-3 py-2 font-mono text-xs leading-relaxed">
                  {failing[0]?.result?.message}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Topic 11's SQL drills.
 *
 * No runner: these need a live Postgres, which is the reason the repo leaves them
 * self-assessed. The page gives the prompt, the setup commands, and the answer behind a
 * reveal — the same loop as the Python drills, minus the automatic grading.
 */
function SqlDrills({ topic }: { topic: TopicDetail }) {
  return (
    <section id="drills" className="mt-16 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">SQL drills</h2>
      <p className="mt-1 text-sm text-muted">
        These need a running Postgres, so they are self-assessed. Start the container, work
        down the list, and tick each one off.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-sunken p-4 font-mono text-xs leading-relaxed">
        {`cd phases/01-foundations/part-a
docker compose -f sql/docker-compose.yml up -d
docker compose -f sql/docker-compose.yml exec db psql -U learner -d learning`}
      </pre>

      <SqlDrillList topic={topic} />
    </section>
  );
}

function SqlDrillList({ topic }: { topic: TopicDetail }) {
  const state = useProgress();

  return (
    <ol className="mt-6 space-y-3">
      {topic.sqlDrills.map((drill) => {
        const key = `${topic.id}.${drill.id}`;
        const done = Boolean(state.sqlDrills[key]?.done);
        return (
          <li key={drill.id} className="rounded-xl border border-line bg-raised p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={done}
                onChange={(event) => {
                  void import("../lib/progress.ts").then(({ setSqlDrillDone }) =>
                    setSqlDrillDone(key, event.target.checked),
                  );
                }}
                className="mt-1 size-4 shrink-0 cursor-pointer accent-accent"
                aria-label={`Mark ${drill.id} complete`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <span className="font-mono text-sm text-faint">{drill.id}</span>{" "}
                  {drill.title}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  <InlineMarkdown text={drill.prompt} />
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-accent hover:underline">
                    Show the reference query
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-sunken p-3 font-mono text-xs leading-relaxed">
                    {drill.solution}
                  </pre>
                </details>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
