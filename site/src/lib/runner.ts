/**
 * The main-thread side of the in-browser pytest runner.
 *
 * Owns a single worker for the whole page. Booting Pyodide costs several seconds and
 * ~10MB of wheels, so it happens once, lazily, and is then reused for every run.
 */

import type { RunRequest, TestResult, WorkerResponse } from "../workers/pyodide.worker.ts";
import { loadRuntime, type TopicDetail } from "./topicDetail.ts";

export type { TestResult };

export type RunnerStatus =
  | { kind: "idle" }
  | { kind: "booting"; detail: string }
  | { kind: "ready" }
  | { kind: "running" }
  | { kind: "error"; message: string };

export interface RunOutcome {
  results: TestResult[];
  output: string;
  durationMs: number;
}

type StatusListener = (status: RunnerStatus) => void;

let worker: Worker | null = null;
let status: RunnerStatus = { kind: "idle" };
const listeners = new Set<StatusListener>();

/** Resolvers for the run currently in flight, if any. */
let pending: { resolve: (outcome: RunOutcome) => void; reject: (error: Error) => void } | null =
  null;

function setStatus(next: RunnerStatus): void {
  status = next;
  for (const listener of listeners) listener(next);
}

export function getStatus(): RunnerStatus {
  return status;
}

export function subscribeStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function ensureWorker(): Worker {
  if (worker) return worker;

  // `new URL(..., import.meta.url)` is the form Vite recognises for bundling a worker.
  worker = new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<WorkerResponse>): void => {
    const message = event.data;
    switch (message.type) {
      case "status":
        setStatus({ kind: "booting", detail: message.detail });
        break;
      case "ready":
        setStatus({ kind: "ready" });
        break;
      case "result":
        setStatus({ kind: "ready" });
        pending?.resolve({
          results: message.results,
          output: message.output,
          durationMs: message.durationMs,
        });
        pending = null;
        break;
      case "error":
        setStatus({ kind: "ready" });
        // A failed run is not a broken runner: a syntax error in the learner's code
        // arrives here too. Reject the run, keep the worker.
        pending?.reject(new Error(message.message));
        pending = null;
        break;
    }
  };

  worker.onerror = (event: ErrorEvent): void => {
    const message = event.message || "The Python runner failed to start.";
    setStatus({ kind: "error", message });
    pending?.reject(new Error(message));
    pending = null;
  };

  return worker;
}

/**
 * Start Pyodide downloading before it is needed.
 *
 * Called when a lesson page becomes idle, so that by the time the learner has read the
 * lesson and scrolled to the first drill, the runtime is already up.
 */
export function warm(): void {
  if (status.kind !== "idle") return;
  setStatus({ kind: "booting", detail: "Preparing Python…" });
  ensureWorker().postMessage({ type: "warm" });
}

/**
 * The reserved key under which the module's imports are edited and stored.
 *
 * Not an exercise name — no drill defines `__preamble__` — so it cannot collide.
 */
export const PREAMBLE_KEY = "__preamble__";

/**
 * Assemble a drill module from the learner's current code.
 *
 * The module is rebuilt from the preamble plus every exercise in source order,
 * substituting whatever the learner has written for each. Exercises they have not touched
 * keep their stub, which still raises `NotImplementedError` exactly as the repo version
 * does — so only the tests for finished work go green.
 *
 * The preamble is editable and substituted the same way. That is not a convenience: some
 * drills leave out an import on purpose (topic 09 expects you to reach for `functools`,
 * topic 08 for `islice`), so a fixed preamble would make those exercises impossible to
 * finish here. This was caught by scripts/verify-drills.mjs.
 *
 * @param topic - The topic being worked on.
 * @param code - Exercise name -> the learner's current source, plus `__preamble__`.
 * @returns The full text of the drill module.
 */
export function assembleModule(topic: TopicDetail, code: Record<string, string>): string {
  const preamble = code[PREAMBLE_KEY] ?? topic.preamble;
  const bodies = topic.exercises.map((exercise) => code[exercise.name] ?? exercise.stub);
  return `${preamble}\n\n\n${bodies.join("\n\n\n")}\n`;
}

/**
 * Run one topic's full pytest suite against the learner's code.
 *
 * The whole module runs, not just the current exercise's tests: the suite takes well
 * under a second, and running it all means finishing exercise 3 immediately updates the
 * status of every exercise rather than only the one in focus.
 */
export async function runTopic(
  topic: TopicDetail,
  code: Record<string, string>,
): Promise<RunOutcome> {
  if (pending) throw new Error("A test run is already in progress.");

  const runtime = await loadRuntime();

  const files: RunRequest["files"] = {
    "conftest.py": runtime.conftest,
    "drills/__init__.py": runtime.drillsInit,
    [`drills/d${topic.id}.py`]: assembleModule(topic, code),
    [`tests/${topic.testModule}`]: topic.testSource,
  };

  setStatus(
    status.kind === "idle" ? { kind: "booting", detail: "Preparing Python…" } : { kind: "running" },
  );

  return new Promise<RunOutcome>((resolve, reject) => {
    pending = { resolve, reject };
    ensureWorker().postMessage({
      type: "run",
      topicId: topic.id,
      testModule: topic.testModule,
      files,
    } satisfies RunRequest);
  });
}
