/**
 * The typed view over the generated curriculum index, plus the completion arithmetic.
 *
 * This module holds only the **index** — topic metadata and exercise names. The source
 * code for drills, solutions, and tests lives in `topics/<id>.json` and is fetched on
 * demand by `topicDetail.ts`, because it is ~340KB and only the page that actually runs
 * code needs any of it.
 *
 * Everything here is derived, never stored. The progress store records raw facts — "this
 * exercise passed", "this criterion is ticked" — and every percentage, status, and
 * "what next" answer is computed from those facts against the current curriculum. So when
 * a lesson is added or a drill renamed, the numbers move on their own rather than drifting
 * away from a stale cached total.
 */

import index from "../generated/curriculum.json" with { type: "json" };
import type { ProgressState } from "./progress.ts";

export interface ExerciseSummary {
  name: string;
  label: string;
  /** False for scaffolding given to the learner, e.g. topic 07's `Tokenizer` protocol. */
  todo: boolean;
  testCount: number;
}

export interface TopicSummary {
  number: string;
  id: string;
  title: string;
  lessonSlug: string;
  /** False for topic 11 (SQL), which needs a database and is self-assessed. */
  graded: boolean;
  exerciseCount: number;
  testCount: number;
  exercises: ExerciseSummary[];
}

export const topics: TopicSummary[] = (index as { topics: TopicSummary[] }).topics;

/** Phase 1 Part A is the only phase with lessons so far; the rest are roadmap-only. */
export const PHASE_WITH_LESSONS = "01-foundations";

/** Total pieces of work a learner can complete in Part A. */
export const TOTAL_EXERCISES = topics.reduce((sum, topic) => sum + topic.exerciseCount, 0);

export function topicByLessonSlug(slug: string): TopicSummary | undefined {
  return topics.find((topic) => topic.lessonSlug === slug);
}

export function topicById(id: string): TopicSummary | undefined {
  return topics.find((topic) => topic.id === id);
}

/** The exercises a learner actually has to write, excluding provided scaffolding. */
export function workableExercises<T extends { todo: boolean }>(topic: { exercises: T[] }): T[] {
  return topic.exercises.filter((exercise) => exercise.todo);
}

/**
 * The stable key an exercise's progress is filed under.
 *
 * Topic id plus definition name, so renaming a function retires its old record rather
 * than silently inheriting a pass it never earned.
 */
export function exerciseKey(topicId: string, exerciseName: string): string {
  return `${topicId}.${exerciseName}`;
}

export function criterionKey(phaseSlug: string, index_: number): string {
  return `${phaseSlug}.${index_}`;
}

export type Status = "complete" | "in-progress" | "upcoming";

export interface TopicProgress {
  done: number;
  total: number;
  percent: number;
  status: Status;
}

/**
 * How far through a topic the learner is.
 *
 * @param topic - The topic to score.
 * @param state - The current progress snapshot.
 * @returns Counts, a rounded percentage, and a coarse status for styling.
 */
export function topicProgress(topic: TopicSummary, state: ProgressState): TopicProgress {
  const total = topic.exerciseCount;

  const done = topic.graded
    ? workableExercises(topic).filter(
        (exercise) => state.exercises[exerciseKey(topic.id, exercise.name)]?.passed,
      ).length
    : Object.keys(state.sqlDrills).filter((key) => key.startsWith(`${topic.id}.`)).length;

  // A lesson that has been opened counts as started even before any exercise passes,
  // otherwise reading a long lesson shows zero movement and feels like no progress.
  const started = done > 0 || Boolean(state.lessons[topic.lessonSlug]?.readAt);

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    status: done === total && total > 0 ? "complete" : started ? "in-progress" : "upcoming",
  };
}

export interface PhaseProgress {
  done: number;
  total: number;
  percent: number;
  status: Status;
  /** What the denominator counts, for the label under the bar. */
  unit: "exercises" | "criteria";
}

/**
 * How far through a phase the learner is.
 *
 * Phase 1 is scored on its 84 Part A exercises, because that is the real work and it can
 * be measured objectively. Phases 2-8 have no lessons yet, so they are scored on their
 * exit criteria — self-assessed, but the only honest signal available for them.
 */
export function phaseProgress(
  phaseSlug: string,
  criteriaCount: number,
  state: ProgressState,
): PhaseProgress {
  if (phaseSlug === PHASE_WITH_LESSONS) {
    const done = topics.reduce((sum, topic) => sum + topicProgress(topic, state).done, 0);
    const total = TOTAL_EXERCISES;
    return {
      done,
      total,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      status: done === total ? "complete" : done > 0 ? "in-progress" : "upcoming",
      unit: "exercises",
    };
  }

  const done = Array.from({ length: criteriaCount }).filter(
    (_, i) => state.criteria[criterionKey(phaseSlug, i)],
  ).length;

  return {
    done,
    total: criteriaCount,
    percent: criteriaCount === 0 ? 0 : Math.round((done / criteriaCount) * 100),
    status:
      criteriaCount > 0 && done === criteriaCount
        ? "complete"
        : done > 0
          ? "in-progress"
          : "upcoming",
    unit: "criteria",
  };
}

export interface NextUp {
  kind: "lesson" | "phase";
  href: string;
  label: string;
  detail: string;
}

/**
 * The single most useful thing to do next.
 *
 * The rule, in order: finish the topic you last touched; otherwise start the first topic
 * that is not complete; otherwise move on to the first unfinished phase. This is what
 * makes the dashboard a guide rather than a menu — there is always exactly one obvious
 * next action.
 */
export function nextUp(
  state: ProgressState,
  phaseSlugs: string[],
  criteriaCounts: Record<string, number>,
): NextUp | null {
  const unfinished = topics.filter((topic) => topicProgress(topic, state).status !== "complete");

  const lastSlug = state.lastVisited?.lessonSlug;
  const resumable = unfinished.find((topic) => topic.lessonSlug === lastSlug);
  const target = resumable ?? unfinished[0];

  if (target) {
    const progress = topicProgress(target, state);
    return {
      kind: "lesson",
      href: `/learn/${target.lessonSlug}`,
      label: `${target.number} — ${target.title}`,
      detail:
        progress.done === 0
          ? `${target.exerciseCount} drills to go`
          : `${progress.done} of ${progress.total} drills done`,
    };
  }

  const nextPhase = phaseSlugs.find(
    (slug) =>
      slug !== PHASE_WITH_LESSONS &&
      phaseProgress(slug, criteriaCounts[slug] ?? 0, state).status !== "complete",
  );
  if (!nextPhase) return null;

  return {
    kind: "phase",
    href: `/phases/${nextPhase}`,
    label: nextPhase.replace(/^\d{2}-/, "").replace(/-/g, " "),
    detail: "Part A complete — on to the next phase",
  };
}

/**
 * Overall progress across the whole roadmap.
 *
 * Part A's exercises and the 47 exit criteria are pooled into one number. They are not
 * equivalent units of work and this does not pretend otherwise — it is a motivation
 * gauge, and the per-phase bars carry the honest detail.
 */
export function overallProgress(
  state: ProgressState,
  criteriaCounts: Record<string, number>,
): { done: number; total: number; percent: number } {
  let done = 0;
  let total = 0;

  for (const [slug, count] of Object.entries(criteriaCounts)) {
    const progress = phaseProgress(slug, count, state);
    done += progress.done;
    total += progress.total;
  }

  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
