/**
 * All learner state, persisted to localStorage.
 *
 * There is deliberately no account system, so this file is the only thing standing
 * between a learner and losing months of work. That shapes three decisions:
 *
 *  - **Versioned schema.** `version` is checked on read and unknown versions are migrated
 *    or discarded explicitly, so a future format change cannot silently wipe progress.
 *  - **Never throws.** A corrupt or unparseable value falls back to an empty state rather
 *    than taking the whole page down — a broken store must not make the site unusable.
 *  - **Exportable.** `exportState`/`importState` back the JSON download button, because
 *    browser storage is easy to clear by accident and there is no server copy.
 *
 * Only raw facts live here. Percentages and statuses are computed in `curriculum.ts`.
 */

const STORAGE_KEY = "lai:progress:v1";
const SCHEMA_VERSION = 1;

export interface ExerciseRecord {
  passed: boolean;
  passedAt?: string;
  /** The learner's in-progress editor content, so a half-finished drill survives a reload. */
  draft?: string;
}

export interface ProgressState {
  version: number;
  exercises: Record<string, ExerciseRecord>;
  lessons: Record<string, { readAt: string }>;
  checks: Record<string, { correct: boolean; attempts: number }>;
  criteria: Record<string, boolean>;
  sqlDrills: Record<string, { done: boolean }>;
  lastVisited?: { lessonSlug: string; at: string };
}

export function emptyState(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    exercises: {},
    lessons: {},
    checks: {},
    criteria: {},
    sqlDrills: {},
  };
}

/**
 * Coerce whatever came out of storage into a valid state.
 *
 * Every field is rebuilt rather than trusted: a hand-edited or partially-written value
 * must not be able to crash a component that assumes `state.exercises` is an object.
 */
function reconcile(input: unknown): ProgressState {
  const base = emptyState();
  if (typeof input !== "object" || input === null) return base;

  const candidate = input as Partial<ProgressState>;
  const record = <T>(value: unknown): Record<string, T> =>
    typeof value === "object" && value !== null ? (value as Record<string, T>) : {};

  return {
    version: SCHEMA_VERSION,
    exercises: record<ExerciseRecord>(candidate.exercises),
    lessons: record<{ readAt: string }>(candidate.lessons),
    checks: record<{ correct: boolean; attempts: number }>(candidate.checks),
    criteria: record<boolean>(candidate.criteria),
    sqlDrills: record<{ done: boolean }>(candidate.sqlDrills),
    lastVisited: candidate.lastVisited,
  };
}

let state: ProgressState = emptyState();
let loaded = false;
const listeners = new Set<() => void>();

/** Server-side rendering has no localStorage; the store stays empty until hydration. */
const canPersist = (): boolean => typeof window !== "undefined" && "localStorage" in window;

function load(): void {
  if (loaded || !canPersist()) return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) state = reconcile(JSON.parse(stored));
  } catch {
    // Corrupt JSON, or storage blocked entirely (Safari private mode, strict cookie
    // settings). Either way an in-memory session is better than a broken page.
    state = emptyState();
  }
}

function persist(): void {
  if (!canPersist()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — most likely a very large set of drafts. Keep the in-memory state
    // so the current session still works.
  }
}

function commit(next: ProgressState): void {
  state = next;
  persist();
  for (const listener of listeners) listener();
}

export function getState(): ProgressState {
  load();
  return state;
}

export function subscribe(listener: () => void): () => void {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Other tabs are the same learner. Without this, two open lessons silently overwrite
// each other's progress on the next write.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = reconcile(event.newValue ? JSON.parse(event.newValue) : null);
    for (const listener of listeners) listener();
  });
}

// --------------------------------------------------------------------------------------
// Actions
// --------------------------------------------------------------------------------------

/** Record a pass or a fail for one exercise. A pass is sticky: it never reverts to false. */
export function setExerciseResult(key: string, passed: boolean): void {
  const current = getState().exercises[key];
  // Once earned, a pass stays. Re-running a suite while editing the *next* exercise
  // should not un-complete work that was already green.
  const alreadyPassed = current?.passed ?? false;
  commit({
    ...state,
    exercises: {
      ...state.exercises,
      [key]: {
        ...current,
        passed: passed || alreadyPassed,
        passedAt: passed && !alreadyPassed ? new Date().toISOString() : current?.passedAt,
      },
    },
  });
}

export function saveDraft(key: string, draft: string): void {
  const current = getState().exercises[key];
  commit({
    ...state,
    exercises: {
      ...state.exercises,
      [key]: { ...current, passed: current?.passed ?? false, draft },
    },
  });
}

export function clearDraft(key: string): void {
  const current = getState().exercises[key];
  if (!current) return;
  const { draft: _discarded, ...rest } = current;
  commit({ ...state, exercises: { ...state.exercises, [key]: rest } });
}

export function markLessonRead(slug: string): void {
  const existing = getState().lessons[slug];
  const lastVisited = { lessonSlug: slug, at: new Date().toISOString() };
  // Keep the original readAt: it marks when the lesson was first opened.
  commit({
    ...state,
    lessons: { ...state.lessons, [slug]: existing ?? { readAt: lastVisited.at } },
    lastVisited,
  });
}

export function recordCheck(id: string, correct: boolean): void {
  const current = getState().checks[id];
  commit({
    ...state,
    checks: {
      ...state.checks,
      [id]: { correct: correct || (current?.correct ?? false), attempts: (current?.attempts ?? 0) + 1 },
    },
  });
}

export function setCriterion(key: string, done: boolean): void {
  const criteria = { ...getState().criteria };
  if (done) criteria[key] = true;
  else delete criteria[key];
  commit({ ...state, criteria });
}

export function setSqlDrillDone(key: string, done: boolean): void {
  const sqlDrills = { ...getState().sqlDrills };
  if (done) sqlDrills[key] = { done: true };
  else delete sqlDrills[key];
  commit({ ...state, sqlDrills });
}

export function resetAll(): void {
  commit(emptyState());
}

// --------------------------------------------------------------------------------------
// Export / import
// --------------------------------------------------------------------------------------

export function exportState(): string {
  return JSON.stringify(getState(), null, 2);
}

/**
 * Replace all progress from an exported file.
 *
 * @param json - The contents of a previously exported file.
 * @returns True if the import was applied; false if the text was not valid progress data.
 */
export function importState(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return false;
    if (!("exercises" in parsed) && !("criteria" in parsed)) return false;
    commit(reconcile(parsed));
    return true;
  } catch {
    return false;
  }
}
