import { beforeEach, describe, expect, it } from "vitest";
import {
  criterionKey,
  describeBreakdown,
  exerciseKey,
  nextUp,
  overallProgress,
  phaseProgress,
  topicByLessonSlug,
  topicProgress,
  topics,
  TOTAL_EXERCISES,
  workableExercises,
  type PhaseCounts,
} from "./curriculum.ts";
import { emptyState, type ProgressState } from "./progress.ts";

/** Build a state in which every workable exercise of the named topics has passed. */
function withTopicsComplete(...topicIds: string[]): ProgressState {
  const state = emptyState();
  for (const id of topicIds) {
    const topic = topics.find((candidate) => candidate.id === id);
    if (!topic) throw new Error(`no such topic: ${id}`);
    if (topic.graded) {
      for (const exercise of workableExercises(topic)) {
        state.exercises[exerciseKey(topic.id, exercise.name)] = { passed: true };
      }
    } else {
      // Topic 11 counts ticked SQL drills rather than passed exercises.
      for (let i = 1; i <= topic.exerciseCount; i += 1) {
        state.sqlDrills[`${topic.id}.11.${i}`] = { done: true };
      }
    }
  }
  return state;
}

let state: ProgressState;
beforeEach(() => {
  state = emptyState();
});

describe("the generated index", () => {
  it("has all twelve Part A topics in order", () => {
    expect(topics).toHaveLength(12);
    expect(topics.map((topic) => topic.number)).toEqual([
      "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11",
    ]);
  });

  it("counts 84 exercises, matching part-a/README.md", () => {
    expect(TOTAL_EXERCISES).toBe(84);
  });

  it("marks only topic 11 as ungraded", () => {
    const ungraded = topics.filter((topic) => !topic.graded).map((topic) => topic.number);
    expect(ungraded).toEqual(["11"]);
  });

  it("gives every graded exercise at least one test", () => {
    // An exercise with no tests could never be completed, and would silently inflate
    // the denominator of every progress bar.
    for (const topic of topics.filter((candidate) => candidate.graded)) {
      for (const exercise of workableExercises(topic)) {
        expect(exercise.testCount, `${topic.id}.${exercise.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("resolves topics by lesson slug", () => {
    expect(topicByLessonSlug("01-core-mechanics")?.id).toBe("01_core_mechanics");
    expect(topicByLessonSlug("nope")).toBeUndefined();
  });
});

describe("topicProgress", () => {
  it("starts at zero and 'upcoming'", () => {
    const topic = topics[1]!;
    expect(topicProgress(topic, state)).toMatchObject({ done: 0, percent: 0, status: "upcoming" });
  });

  it("counts an opened lesson as in progress before any drill passes", () => {
    const topic = topics[1]!;
    state.lessons[topic.lessonSlug] = { readAt: new Date().toISOString() };
    expect(topicProgress(topic, state).status).toBe("in-progress");
    expect(topicProgress(topic, state).done).toBe(0);
  });

  it("reaches 100% and 'complete' when every workable exercise passes", () => {
    const topic = topics[1]!;
    const completed = withTopicsComplete(topic.id);
    expect(topicProgress(topic, completed)).toMatchObject({
      done: topic.exerciseCount,
      percent: 100,
      status: "complete",
    });
  });

  it("ignores provided scaffolding when scoring", () => {
    // Topic 07 ships a `Tokenizer` Protocol that is given, not written.
    const topic = topics.find((candidate) => candidate.number === "07")!;
    expect(topic.exercises.length).toBeGreaterThan(workableExercises(topic).length);
    expect(topicProgress(topic, withTopicsComplete(topic.id)).percent).toBe(100);
  });

  it("scores the SQL topic on ticked drills", () => {
    const topic = topics.find((candidate) => candidate.number === "11")!;
    expect(topicProgress(topic, withTopicsComplete(topic.id)).status).toBe("complete");
  });

  it("counts a tested-out topic as complete, and says so", () => {
    const topic = topics[3]!;
    state.testedOut[topic.id] = { at: new Date().toISOString() };
    expect(topicProgress(topic, state)).toMatchObject({
      done: topic.exerciseCount,
      percent: 100,
      status: "complete",
      testedOut: true,
    });
  });

  it("never shows 100% for unfinished work", () => {
    // 83 of 84 rounds to 99%, not 100%.
    const topic = topics.find((candidate) => candidate.exerciseCount > 1)!;
    const [first] = workableExercises(topic);
    state.exercises[exerciseKey(topic.id, first!.name)] = { passed: true };
    expect(topicProgress(topic, state).percent).toBeLessThan(100);
  });
});

describe("phaseProgress", () => {
  const counts = (criteria: number, parts: string[] = []): PhaseCounts => ({ criteria, parts });

  it("scores Phase 1 on drills, parts, and criteria together", () => {
    const progress = phaseProgress("01-foundations", counts(8, ["p1", "p2"]), state);
    expect(progress.total).toBe(TOTAL_EXERCISES + 8 + 2);
    expect(progress.breakdown.drills).toEqual({ done: 0, total: TOTAL_EXERCISES });
  });

  it("scores other phases on parts plus exit criteria", () => {
    state.criteria[criterionKey("02-llms-and-model-apis", 0)] = true;
    state.criteria[criterionKey("02-llms-and-model-apis", 3)] = true;
    state.parts.a = true;
    const progress = phaseProgress("02-llms-and-model-apis", counts(5, ["a", "b", "c"]), state);
    expect(progress).toMatchObject({ done: 3, total: 8, percent: 38 });
    expect(progress.breakdown).toEqual({
      parts: { done: 1, total: 3 },
      criteria: { done: 2, total: 5 },
    });
    expect(describeBreakdown(progress)).toBe("1/3 parts · 2/5 criteria");
  });

  it("ignores ticks for parts that no longer exist", () => {
    // A reworded bullet retires its key; the old tick must not inflate the new total.
    state.parts["retired-key"] = true;
    expect(phaseProgress("02-x", counts(0, ["current-key"]), state).done).toBe(0);
  });

  it("is complete only when every part and criterion is ticked", () => {
    for (let i = 0; i < 5; i += 1) state.criteria[criterionKey("02-x", i)] = true;
    expect(phaseProgress("02-x", counts(5, ["a"]), state).status).toBe("in-progress");
    state.parts.a = true;
    expect(phaseProgress("02-x", counts(5, ["a"]), state).status).toBe("complete");
  });

  it("does not call an empty phase complete", () => {
    expect(phaseProgress("07-production", counts(0), state).status).toBe("upcoming");
  });

  it("counts tested-out Part A topics toward Phase 1", () => {
    for (const topic of topics) state.testedOut[topic.id] = { at: new Date().toISOString() };
    const progress = phaseProgress("01-foundations", counts(0), state);
    expect(progress.breakdown.drills).toEqual({ done: TOTAL_EXERCISES, total: TOTAL_EXERCISES });
    expect(progress.status).toBe("complete");
  });
});

describe("nextUp", () => {
  const slugs = ["01-foundations", "02-llms-and-model-apis"];
  const counts: Record<string, PhaseCounts> = {
    "01-foundations": { criteria: 8, parts: ["p1"] },
    "02-llms-and-model-apis": { criteria: 5, parts: ["q1", "q2"] },
  };

  /** Everything in Phase 1 finished: every topic, its part, and its criteria. */
  function withPhaseOneDone(): ProgressState {
    const done = withTopicsComplete(...topics.map((topic) => topic.id));
    done.parts.p1 = true;
    for (let i = 0; i < 8; i += 1) done.criteria[criterionKey("01-foundations", i)] = true;
    return done;
  }

  it("points at the first topic for a brand-new learner", () => {
    const next = nextUp(state, slugs, counts);
    expect(next).toMatchObject({ kind: "lesson", href: "/learn/00-python-basics" });
    expect(next?.detail).toContain("drills to go");
  });

  it("resumes the topic you last visited, not the first unfinished one", () => {
    state.lastVisited = { lessonSlug: "05-files-and-json", at: new Date().toISOString() };
    expect(nextUp(state, slugs, counts)?.href).toBe("/learn/05-files-and-json");
  });

  it("falls through to the first unfinished topic when the last visit is complete", () => {
    const completed = withTopicsComplete("00_python_basics");
    completed.lastVisited = { lessonSlug: "00-python-basics", at: new Date().toISOString() };
    expect(nextUp(completed, slugs, counts)?.href).toBe("/learn/01-core-mechanics");
  });

  it("skips topics the learner tested out of", () => {
    state.testedOut["00_python_basics"] = { at: new Date().toISOString() };
    expect(nextUp(state, slugs, counts)?.href).toBe("/learn/01-core-mechanics");
  });

  it("sends you back to Phase 1 while its own parts and criteria remain", () => {
    const done = withTopicsComplete(...topics.map((topic) => topic.id));
    expect(nextUp(done, slugs, counts)).toMatchObject({
      kind: "phase",
      href: "/phases/01-foundations",
    });
  });

  it("moves on to the next phase once Phase 1 is complete", () => {
    const next = nextUp(withPhaseOneDone(), slugs, counts);
    expect(next).toMatchObject({ kind: "phase", href: "/phases/02-llms-and-model-apis" });
    expect(next?.detail).toBe("7 of 7 items left");
  });

  it("returns null when everything is complete", () => {
    const done = withPhaseOneDone();
    done.parts.q1 = true;
    done.parts.q2 = true;
    for (let i = 0; i < 5; i += 1) {
      done.criteria[criterionKey("02-llms-and-model-apis", i)] = true;
    }
    expect(nextUp(done, slugs, counts)).toBeNull();
  });
});

describe("overallProgress", () => {
  const counts: Record<string, PhaseCounts> = {
    "01-foundations": { criteria: 8, parts: ["p1"] },
    "02-llms-and-model-apis": { criteria: 5, parts: ["q1"] },
  };

  it("pools drills, parts, and criteria", () => {
    expect(overallProgress(state, counts)).toEqual({
      done: 0,
      total: TOTAL_EXERCISES + 8 + 1 + 5 + 1,
      percent: 0,
    });
  });

  it("reaches 100% only when everything is complete", () => {
    const done = withTopicsComplete(...topics.map((topic) => topic.id));
    done.parts.p1 = true;
    done.parts.q1 = true;
    for (let i = 0; i < 8; i += 1) done.criteria[criterionKey("01-foundations", i)] = true;
    for (let i = 0; i < 4; i += 1) done.criteria[criterionKey("02-llms-and-model-apis", i)] = true;
    expect(overallProgress(done, counts).percent).toBeLessThan(100);
    done.criteria[criterionKey("02-llms-and-model-apis", 4)] = true;
    expect(overallProgress(done, counts).percent).toBe(100);
  });

  it("never divides by zero", () => {
    expect(overallProgress(state, {})).toEqual({ done: 0, total: 0, percent: 0 });
  });
});
