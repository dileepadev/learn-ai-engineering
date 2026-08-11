/**
 * Lazy access to a topic's source code.
 *
 * The drill, solution, and test source for all twelve topics is ~340KB. Only the lesson
 * page a learner is actually on needs any of it, so it is split into one file per topic
 * and fetched on demand — `curriculum.ts` carries the small index that every page uses.
 */

export interface Exercise {
  name: string;
  label: string;
  kind: "function" | "class" | "alias";
  signature: string;
  docstring: string;
  stub: string;
  solution: string;
  todo: boolean;
  tests: string[];
}

export interface SqlDrill {
  id: string;
  title: string;
  prompt: string;
  solution: string;
}

export interface TopicDetail {
  number: string;
  id: string;
  title: string;
  lessonSlug: string;
  graded: boolean;
  exerciseCount: number;
  testCount: number;
  preamble: string;
  /** The answer key's imports, which may include ones the drill deliberately omits. */
  solutionPreamble: string;
  stubSource: string;
  solutionSource: string;
  testSource: string;
  testModule: string;
  exercises: Exercise[];
  unmappedTests: string[];
  sqlDrills: SqlDrill[];
  sqlFiles: Record<string, string>;
}

export interface Runtime {
  conftest: string;
  drillsInit: string;
}

/**
 * `import.meta.glob` rather than a bare dynamic import with a variable path: Vite can
 * only code-split what it can enumerate at build time, and this is the form that makes it
 * emit one chunk per topic instead of bundling all twelve into the caller.
 */
const detailModules = import.meta.glob<{ default: TopicDetail }>("../generated/topics/*.json");
const runtimeModule = () => import("../generated/runtime.json");

const cache = new Map<string, Promise<TopicDetail>>();

/**
 * Load one topic's full detail, memoised for the life of the page.
 *
 * @param topicId - The topic id, e.g. `01_core_mechanics`.
 * @returns The topic's source code and exercises.
 * @throws If no generated file exists for the id.
 */
export function loadTopicDetail(topicId: string): Promise<TopicDetail> {
  const cached = cache.get(topicId);
  if (cached) return cached;

  const load = detailModules[`../generated/topics/${topicId}.json`];
  if (!load) {
    return Promise.reject(new Error(`No generated detail for topic "${topicId}".`));
  }

  const promise = load().then((module) => module.default);
  cache.set(topicId, promise);
  return promise;
}

let runtimeCache: Promise<Runtime> | null = null;

/** The shared `conftest.py` and package marker the in-browser test run needs. */
export function loadRuntime(): Promise<Runtime> {
  runtimeCache ??= runtimeModule().then((module) => module.default as Runtime);
  return runtimeCache;
}
