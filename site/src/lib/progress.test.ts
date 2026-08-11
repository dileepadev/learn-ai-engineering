import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  emptyState,
  exportState,
  getState,
  importState,
  markLessonRead,
  recordCheck,
  resetAll,
  saveDraft,
  setCriterion,
  setExerciseResult,
  setSqlDrillDone,
} from "./progress.ts";

const STORAGE_KEY = "lai:progress:v1";

beforeEach(() => {
  localStorage.clear();
  resetAll();
});

describe("exercise results", () => {
  it("records a pass with a timestamp", () => {
    setExerciseResult("01_core_mechanics.last_n_messages", true);
    const record = getState().exercises["01_core_mechanics.last_n_messages"];
    expect(record?.passed).toBe(true);
    expect(record?.passedAt).toBeTypeOf("string");
  });

  it("keeps a pass sticky when a later run reports failure", () => {
    // Running the suite while editing the *next* exercise must not un-complete work
    // that was already green.
    setExerciseResult("t.a", true);
    setExerciseResult("t.a", false);
    expect(getState().exercises["t.a"]?.passed).toBe(true);
  });

  it("does not overwrite the original pass timestamp", () => {
    setExerciseResult("t.a", true);
    const first = getState().exercises["t.a"]?.passedAt;
    setExerciseResult("t.a", true);
    expect(getState().exercises["t.a"]?.passedAt).toBe(first);
  });
});

describe("drafts", () => {
  it("saves and clears a draft without losing the pass", () => {
    setExerciseResult("t.a", true);
    saveDraft("t.a", "def a(): return 1");
    expect(getState().exercises["t.a"]?.draft).toBe("def a(): return 1");
    expect(getState().exercises["t.a"]?.passed).toBe(true);

    clearDraft("t.a");
    expect(getState().exercises["t.a"]?.draft).toBeUndefined();
    expect(getState().exercises["t.a"]?.passed).toBe(true);
  });
});

describe("lessons, checks, criteria, and SQL drills", () => {
  it("keeps the first readAt on repeat visits", () => {
    markLessonRead("01-core-mechanics");
    const first = getState().lessons["01-core-mechanics"]?.readAt;
    markLessonRead("01-core-mechanics");
    expect(getState().lessons["01-core-mechanics"]?.readAt).toBe(first);
  });

  it("updates lastVisited on every visit", () => {
    markLessonRead("01-core-mechanics");
    markLessonRead("02-functions");
    expect(getState().lastVisited?.lessonSlug).toBe("02-functions");
  });

  it("counts attempts and keeps a correct answer sticky", () => {
    recordCheck("c1", false);
    recordCheck("c1", true);
    recordCheck("c1", false);
    expect(getState().checks.c1).toEqual({ correct: true, attempts: 3 });
  });

  it("deletes rather than stores false for criteria", () => {
    setCriterion("02-llms.1", true);
    expect(getState().criteria["02-llms.1"]).toBe(true);
    setCriterion("02-llms.1", false);
    expect("02-llms.1" in getState().criteria).toBe(false);
  });

  it("tracks SQL drills the same way", () => {
    setSqlDrillDone("11_a_little_sql.11.3", true);
    expect(getState().sqlDrills["11_a_little_sql.11.3"]?.done).toBe(true);
    setSqlDrillDone("11_a_little_sql.11.3", false);
    expect("11_a_little_sql.11.3" in getState().sqlDrills).toBe(false);
  });
});

describe("persistence and recovery", () => {
  it("writes through to localStorage", () => {
    setExerciseResult("t.a", true);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({ version: 1 });
  });

  it("round-trips through export and import", () => {
    setExerciseResult("t.a", true);
    setCriterion("02-llms.0", true);
    const exported = exportState();

    resetAll();
    expect(getState().exercises["t.a"]).toBeUndefined();

    expect(importState(exported)).toBe(true);
    expect(getState().exercises["t.a"]?.passed).toBe(true);
    expect(getState().criteria["02-llms.0"]).toBe(true);
  });

  it("rejects a file that is not progress data", () => {
    expect(importState("not json at all")).toBe(false);
    expect(importState('{"unrelated": 1}')).toBe(false);
    expect(importState("null")).toBe(false);
  });

  it("survives a partially-shaped stored value", () => {
    // A hand-edited or half-written value must not crash a component that assumes
    // `state.exercises` is an object.
    expect(importState('{"exercises": null, "criteria": {"a": true}}')).toBe(true);
    expect(getState().exercises).toEqual({});
    expect(getState().criteria.a).toBe(true);
    expect(getState().lessons).toEqual({});
  });
});

describe("emptyState", () => {
  it("is versioned and fully populated", () => {
    const state = emptyState();
    expect(state.version).toBe(1);
    for (const key of ["exercises", "lessons", "checks", "criteria", "sqlDrills"] as const) {
      expect(state[key]).toEqual({});
    }
  });
});
