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
 *
 * New fields are added **additively**: `reconcile` fills in a default for anything an
 * older save lacks, so `SCHEMA_VERSION` only needs to move when an existing field changes
 * meaning. That is why the 2026 edition's `parts`, `testedOut`, `plan`, and `edition`
 * fields did not need a migration — a save from before them loads with every old tick
 * intact and the new fields empty.
 */

import { EDITION } from "./edition.ts";

/** The edition every save made before `ProgressState.edition` existed belongs to. */
const PRE_EDITION_SAVE = "2026";

const STORAGE_KEY = "lai:progress:v1";
const SCHEMA_VERSION = 1;

export interface ExerciseRecord {
  passed: boolean;
  passedAt?: string;
  /** The learner's in-progress editor content, so a half-finished drill survives a reload. */
  draft?: string;
}

/**
 * Year-end planner settings — see `sprint.ts`.
 *
 * Only the learner's own input is stored. The plan itself is recomputed from today on every
 * view, so it can never go stale: tick something and every date moves.
 */
export interface PlanSettings {
  /** How many hours a week the learner says they have, or null if never set. */
  hoursPerWeek: number | null;
}

export interface ProgressState {
  version: number;
  /** The roadmap edition this progress was made against — see `edition.ts`. */
  edition: string;
  exercises: Record<string, ExerciseRecord>;
  lessons: Record<string, { readAt: string }>;
  checks: Record<string, { correct: boolean; attempts: number }>;
  criteria: Record<string, boolean>;
  /** Ticked parts of the phase docs, keyed by `Part.key` (see `parts.ts`). */
  parts: Record<string, boolean>;
  /**
   * Part A topics the learner already knows, keyed by topic id. Counted as complete but
   * kept apart from `exercises`, so "tested out" is never mistaken for "passed the tests".
   */
  testedOut: Record<string, { at: string }>;
  sqlDrills: Record<string, { done: boolean }>;
  plan: PlanSettings;
  lastVisited?: { lessonSlug: string; at: string };
}

export function emptyState(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    edition: EDITION,
    exercises: {},
    lessons: {},
    checks: {},
    criteria: {},
    parts: {},
    testedOut: {},
    sqlDrills: {},
    plan: { hoursPerWeek: null },
  };
}

/** A week has 168 hours; anything outside 1–112 (16 a day) is a typo, not a plan. */
export const MAX_HOURS_PER_WEEK = 112;

function reconcilePlan(value: unknown): PlanSettings {
  const plan = typeof value === "object" && value !== null ? (value as Partial<PlanSettings>) : {};
  const hours = plan.hoursPerWeek;
  return {
    hoursPerWeek:
      typeof hours === "number" && Number.isFinite(hours) && hours >= 1 && hours <= MAX_HOURS_PER_WEEK
        ? Math.round(hours)
        : null,
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
    // A save from before editions existed was made against the 2026 curriculum. That is a
    // fixed fact about old saves, so it must not follow `EDITION` when the edition moves on —
    // labelling an old save with the current edition would hide that its ticks are stale.
    edition:
      typeof candidate.edition === "string" && candidate.edition !== ""
        ? candidate.edition
        : PRE_EDITION_SAVE,
    exercises: record<ExerciseRecord>(candidate.exercises),
    lessons: record<{ readAt: string }>(candidate.lessons),
    checks: record<{ correct: boolean; attempts: number }>(candidate.checks),
    criteria: record<boolean>(candidate.criteria),
    parts: record<boolean>(candidate.parts),
    testedOut: record<{ at: string }>(candidate.testedOut),
    sqlDrills: record<{ done: boolean }>(candidate.sqlDrills),
    plan: reconcilePlan(candidate.plan),
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

/** Tick or untick one part. */
export function setPart(key: string, done: boolean): void {
  setParts([key], done);
}

/**
 * Tick or untick many parts in one write — "mark this section done".
 *
 * One commit rather than a loop of `setPart` calls: every commit notifies every island on
 * the page and rewrites localStorage, and a section can hold a dozen parts.
 */
export function setParts(keys: readonly string[], done: boolean): void {
  const parts = { ...getState().parts };
  for (const key of keys) {
    if (done) parts[key] = true;
    else delete parts[key];
  }
  commit({ ...state, parts });
}

/**
 * Mark a Part A topic as already known — or take that back.
 *
 * Testing out counts the topic as complete for progress, but nothing is written to
 * `exercises`: the drills stay unpassed, so undoing it restores exactly the previous state.
 */
export function setTestedOut(topicId: string, testedOut: boolean): void {
  const next = { ...getState().testedOut };
  if (testedOut) next[topicId] = { at: new Date().toISOString() };
  else delete next[topicId];
  commit({ ...state, testedOut: next });
}

/** Save the hours a week the learner can give the sprint; null (or nonsense) clears it. */
export function setHoursPerWeek(hours: number | null): void {
  commit({ ...getState(), plan: reconcilePlan({ hoursPerWeek: hours }) });
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
    if (!("exercises" in parsed) && !("criteria" in parsed) && !("parts" in parsed)) return false;
    commit(reconcile(parsed));
    return true;
  } catch {
    return false;
  }
}
