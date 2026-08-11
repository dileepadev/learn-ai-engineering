/// <reference lib="webworker" />
/**
 * Runs the real Part A pytest suites inside Pyodide.
 *
 * This lives in a Web Worker because `pytest.main()` is a blocking call. On the main
 * thread it would freeze the page — no scrolling, no typing, no spinner — for the whole
 * run, and Pyodide's several-second first boot would look like a crash.
 *
 * The Python side is `driver.py`, imported as raw text and executed once at boot. It uses
 * the repo's own `conftest.py`, so imports resolve through the same machinery as
 * `uv run pytest`. Nothing about the drills or their tests is adapted for the browser:
 * the suite that grades you here is the suite in the repo.
 *
 * Learner code executes inside the WASM sandbox — no network, no access to the real
 * filesystem, no reach back into the page. That is what makes running arbitrary typed-in
 * Python safe by construction.
 */

// `?raw` keeps one copy of the driver, shared with scripts/verify-drills.mjs, so the code
// the browser runs is the code the regression test exercises.
import driverSource from "./driver.py?raw";

// Pinned deliberately. Pyodide's runtime and its package wheels are versioned together,
// so an unpinned "latest" could pair a new runtime with cached older wheels.
const PYODIDE_VERSION = "314.0.4";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export interface RunRequest {
  type: "run";
  /** Topic id, e.g. `01_core_mechanics`. */
  topicId: string;
  /** Filename of the test module, e.g. `test_01_core_mechanics.py`. */
  testModule: string;
  /** Virtual-FS path (relative to `/part-a`) -> file contents. */
  files: Record<string, string>;
}

export interface TestResult {
  name: string;
  outcome: "passed" | "failed" | "skipped";
  /** Formatted traceback; empty when the test passed. */
  message: string;
}

export type WorkerResponse =
  | { type: "status"; stage: "downloading" | "starting" | "installing"; detail: string }
  | { type: "ready" }
  | { type: "result"; results: TestResult[]; output: string; durationMs: number }
  | { type: "error"; message: string };

interface PyodideApi {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, data: string, opts: { encoding: "utf8" }): void;
  };
  loadPackage(names: string | string[]): Promise<void>;
  runPython(code: string): unknown;
  globals: { get(name: string): unknown };
}

const post = (message: WorkerResponse): void => {
  self.postMessage(message);
};

let pyodide: PyodideApi | null = null;
let booting: Promise<PyodideApi> | null = null;

async function boot(): Promise<PyodideApi> {
  post({ type: "status", stage: "downloading", detail: "Fetching Python runtime…" });

  // `@vite-ignore` stops Vite trying to resolve and bundle a CDN URL at build time.
  const module = (await import(/* @vite-ignore */ `${PYODIDE_INDEX}pyodide.mjs`)) as {
    loadPyodide(options: { indexURL: string }): Promise<PyodideApi>;
  };

  post({ type: "status", stage: "starting", detail: "Starting Python 3.14…" });
  const instance = await module.loadPyodide({ indexURL: PYODIDE_INDEX });

  post({ type: "status", stage: "installing", detail: "Loading pytest…" });
  // pytest ships inside the Pyodide distribution, so its wheels come from the same pinned
  // CDN directory rather than a runtime trip to PyPI.
  await instance.loadPackage("pytest");

  instance.FS.mkdirTree("/part-a/drills");
  instance.FS.mkdirTree("/part-a/tests");
  instance.runPython(driverSource);

  post({ type: "ready" });
  return instance;
}

function ensureBooted(): Promise<PyodideApi> {
  if (pyodide) return Promise.resolve(pyodide);
  booting ??= boot().then((instance) => {
    pyodide = instance;
    return instance;
  });
  return booting;
}

async function run(request: RunRequest): Promise<void> {
  const instance = await ensureBooted();
  const started = performance.now();

  for (const [path, contents] of Object.entries(request.files)) {
    instance.FS.writeFile(`/part-a/${path}`, contents, { encoding: "utf8" });
  }

  instance.runPython(`OUT = run_suite(${JSON.stringify(request.testModule)})`);

  const parsed = JSON.parse(String(instance.globals.get("OUT"))) as {
    exitCode: number;
    collectError: string | null;
    results: TestResult[];
    output: string;
  };

  if (parsed.collectError) {
    // Collection failed, so `results` is empty. Surfacing the collection error as the
    // message is the only way the learner ever sees their syntax error.
    post({ type: "error", message: parsed.collectError });
    return;
  }

  post({
    type: "result",
    results: parsed.results,
    output: parsed.output,
    durationMs: Math.round(performance.now() - started),
  });
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

self.onmessage = (event: MessageEvent<RunRequest | { type: "warm" }>): void => {
  const data = event.data;

  if (data.type === "warm") {
    void ensureBooted().catch((error: unknown) => {
      post({ type: "error", message: describe(error) });
    });
    return;
  }

  if (data.type === "run") {
    void run(data).catch((error: unknown) => {
      post({ type: "error", message: describe(error) });
    });
  }
};
