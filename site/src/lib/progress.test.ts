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
  setHoursPerWeek,
  setPart,
  setParts,
  setSqlDrillDone,
  setTestedOut,
} from "./progress.ts";
import { EDITION } from "./edition.ts";

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
    expect(state.edition).toBe(EDITION);
    expect(state.plan).toEqual({ hoursPerWeek: null });
    for (const key of [
      "exercises",
      "lessons",
      "checks",
      "criteria",
      "parts",
      "testedOut",
      "sqlDrills",
    ] as const) {
      expect(state[key]).toEqual({});
    }
  });
});

describe("parts, testing out, and the plan", () => {
  it("ticks and unticks one part, deleting rather than storing false", () => {
    setPart("04-rag/resources/abc", true);
    expect(getState().parts["04-rag/resources/abc"]).toBe(true);
    setPart("04-rag/resources/abc", false);
    expect("04-rag/resources/abc" in getState().parts).toBe(false);
  });

  it("marks a whole section in one write", () => {
    let writes = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (this: Storage, ...args: [string, string]) {
      writes += 1;
      return original.apply(this, args);
    };
    try {
      setParts(["a", "b", "c"], true);
    } finally {
      Storage.prototype.setItem = original;
    }
    expect(writes).toBe(1);
    expect(Object.keys(getState().parts).sort()).toEqual(["a", "b", "c"]);
    setParts(["a", "c"], false);
    expect(Object.keys(getState().parts)).toEqual(["b"]);
  });

  it("tests out of a topic without touching its drill results", () => {
    setExerciseResult("01_core_mechanics.x", true);
    setTestedOut("01_core_mechanics", true);
    expect(getState().testedOut["01_core_mechanics"]?.at).toBeTypeOf("string");
    setTestedOut("01_core_mechanics", false);
    expect(getState().testedOut).toEqual({});
    expect(getState().exercises["01_core_mechanics.x"]?.passed).toBe(true);
  });

  it("keeps sensible hours a week and drops nonsense", () => {
    setHoursPerWeek(25);
    expect(getState().plan.hoursPerWeek).toBe(25);
    setHoursPerWeek(0);
    expect(getState().plan.hoursPerWeek).toBeNull();
    setHoursPerWeek(500);
    expect(getState().plan.hoursPerWeek).toBeNull();
    setHoursPerWeek(12.6);
    expect(getState().plan.hoursPerWeek).toBe(13);
  });

  it("loads a save from before the 2026 edition with every old tick intact", () => {
    // Exactly the shape the site wrote before parts, testing out, and the plan existed.
    const legacy = JSON.stringify({
      version: 1,
      exercises: { "t.a": { passed: true } },
      lessons: {},
      checks: {},
      criteria: { "02-llms-and-model-apis.0": true },
      sqlDrills: {},
    });
    expect(importState(legacy)).toBe(true);
    const state = getState();
    expect(state.exercises["t.a"]?.passed).toBe(true);
    expect(state.criteria["02-llms-and-model-apis.0"]).toBe(true);
    expect(state).toMatchObject({ edition: "2026", parts: {}, testedOut: {}, plan: { hoursPerWeek: null } });
  });

  it("round-trips the new fields through export and import", () => {
    setPart("01-foundations/resources/x", true);
    setTestedOut("00_python_basics", true);
    setHoursPerWeek(30);
    const exported = exportState();
    resetAll();
    expect(importState(exported)).toBe(true);
    expect(getState().parts["01-foundations/resources/x"]).toBe(true);
    expect(getState().testedOut["00_python_basics"]).toBeDefined();
    expect(getState().plan.hoursPerWeek).toBe(30);
  });

  it("accepts an export that only holds parts", () => {
    expect(importState('{"parts": {"a": true}}')).toBe(true);
    expect(getState().parts.a).toBe(true);
  });
});
