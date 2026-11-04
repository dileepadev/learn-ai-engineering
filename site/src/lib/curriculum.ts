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

/**
 * A rounded percentage that never claims 100% for unfinished work.
 *
 * Plain `Math.round` turns 199/200 into "100%", which reads as done when it is not. A bar
 * only reaches 100 when every item is.
 */
function percentOf(done: number, total: number): number {
  if (total === 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}

export interface TopicProgress {
  done: number;
  total: number;
  percent: number;
  status: Status;
  /** True when the learner marked the topic as already known instead of passing it. */
  testedOut: boolean;
}

/**
 * How far through a topic the learner is.
 *
 * A topic the learner has *tested out of* counts as complete — that is the point of the
 * option for someone who already knows the material — but the result says so, so the UI
 * can show "tested out" rather than "passed".
 *
 * @param topic - The topic to score.
 * @param state - The current progress snapshot.
 * @returns Counts, a rounded percentage, and a coarse status for styling.
 */
export function topicProgress(topic: TopicSummary, state: ProgressState): TopicProgress {
  const total = topic.exerciseCount;

  if (state.testedOut[topic.id]) {
    return { done: total, total, percent: percentOf(total, total), status: "complete", testedOut: true };
  }

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
    percent: percentOf(done, total),
    status: done === total && total > 0 ? "complete" : started ? "in-progress" : "upcoming",
    testedOut: false,
  };
}

/**
 * What a phase contains, as the pages know it at build time.
 *
 * `parts` is the list of part keys rather than a count, because a count cannot tell a
 * current part from a *retired* one: rewording a bullet changes its key (see `parts.ts`),
 * and an old tick still sitting in storage must not count toward the new total.
 */
export interface PhaseCounts {
  criteria: number;
  parts: readonly string[];
}

export const NO_COUNTS: PhaseCounts = { criteria: 0, parts: [] };

export interface Tally {
  done: number;
  total: number;
}

export interface PhaseProgress {
  done: number;
  total: number;
  percent: number;
  status: Status;
  /** The pieces the headline number pools, for the label under each bar. */
  breakdown: { parts: Tally; criteria: Tally; drills?: Tally };
}

/**
 * How far through a phase the learner is.
 *
 * Every phase is scored on its **parts** (each skill bullet, project step, and resource)
 * plus its **exit criteria**. Phase 1 also counts its Part A **drills**, where a tested-out
 * topic counts as done. These are pooled into one number: they are not equal units of work
 * and the breakdown is shown alongside so the headline never has to pretend they are.
 */
export function phaseProgress(
  phaseSlug: string,
  counts: PhaseCounts,
  state: ProgressState,
): PhaseProgress {
  const parts: Tally = {
    done: counts.parts.filter((key) => state.parts[key]).length,
    total: counts.parts.length,
  };
  const criteria: Tally = {
    done: Array.from({ length: counts.criteria }).filter(
      (_, i) => state.criteria[criterionKey(phaseSlug, i)],
    ).length,
    total: counts.criteria,
  };
  const drills: Tally | undefined =
    phaseSlug === PHASE_WITH_LESSONS
      ? {
          done: topics.reduce((sum, topic) => sum + topicProgress(topic, state).done, 0),
          total: TOTAL_EXERCISES,
        }
      : undefined;

  const done = parts.done + criteria.done + (drills?.done ?? 0);
  const total = parts.total + criteria.total + (drills?.total ?? 0);

  return {
    done,
    total,
    percent: percentOf(done, total),
    status: total > 0 && done === total ? "complete" : done > 0 ? "in-progress" : "upcoming",
    breakdown: drills ? { parts, criteria, drills } : { parts, criteria },
  };
}

/** "12/71 parts · 2/5 criteria" — the label under a phase's bar. */
export function describeBreakdown(progress: PhaseProgress): string {
  const { parts, criteria, drills } = progress.breakdown;
  const pieces = [`${parts.done}/${parts.total} parts`, `${criteria.done}/${criteria.total} criteria`];
  if (drills) pieces.unshift(`${drills.done}/${drills.total} drills`);
  return pieces.join(" · ");
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
 * that is not complete (tested-out topics count as complete); otherwise open the first
 * phase that still has unticked parts or criteria — Phase 1 included, since its own parts
 * and criteria outlive its drills. This is what makes the dashboard a guide rather than a
 * menu — there is always exactly one obvious next action.
 */
export function nextUp(
  state: ProgressState,
  phaseSlugs: string[],
  counts: Record<string, PhaseCounts>,
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
    (slug) => phaseProgress(slug, counts[slug] ?? NO_COUNTS, state).status !== "complete",
  );
  if (!nextPhase) return null;

  const progress = phaseProgress(nextPhase, counts[nextPhase] ?? NO_COUNTS, state);
  const left = progress.total - progress.done;
  return {
    kind: "phase",
    href: `/phases/${nextPhase}`,
    label: nextPhase.replace(/^\d{2}-/, "").replace(/-/g, " "),
    detail:
      nextPhase === PHASE_WITH_LESSONS
        ? `Part A done — ${left} parts and criteria left in this phase`
        : `${left} of ${progress.total} items left`,
  };
}

/**
 * Overall progress across the whole roadmap.
 *
 * Every phase's parts, criteria, and (for Phase 1) drills, pooled into one number. They are
 * not equivalent units of work and this does not pretend otherwise — it is a motivation
 * gauge, and the per-phase breakdowns carry the honest detail.
 */
export function overallProgress(
  state: ProgressState,
  counts: Record<string, PhaseCounts>,
): { done: number; total: number; percent: number } {
  let done = 0;
  let total = 0;

  for (const [slug, phaseCounts] of Object.entries(counts)) {
    const progress = phaseProgress(slug, phaseCounts, state);
    done += progress.done;
    total += progress.total;
  }

  return { done, total, percent: percentOf(done, total) };
}
