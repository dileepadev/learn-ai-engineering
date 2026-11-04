/**
 * The year-end planner: what is left, when each phase has to be finished to make the
 * edition's deadline, and whether the learner's weekly hours get them there.
 *
 * Everything here is a pure function of today's date, the deadline, and progress, so the
 * plan is recomputed on every view and never goes stale. Two simplifications, stated
 * plainly because they shape every number on the panel:
 *
 *  - **Effort comes from the docs.** Each phase's `**Effort:**` line ("~25–40 hours") is the
 *    budget; the hours left in a phase are that budget times the share of its items not yet
 *    ticked. Testing out of what you know therefore shrinks the plan honestly.
 *  - **Dates are calendar dates, not instants.** Everything is a `YYYY-MM-DD` string and
 *    arithmetic happens on whole days, so a time zone or daylight-saving change can never
 *    move a deadline by a day.
 */

export interface PhaseLoad {
  slug: string;
  title: string;
  /** The phase's whole budget, in hours (see `effortHours`). */
  effortHours: number;
  /** How much of the phase is ticked, 0–1. */
  doneFraction: number;
}

export interface PhaseTarget {
  slug: string;
  title: string;
  hoursLeft: number;
  /** Finish by this local date to stay on schedule; null once done or past the deadline. */
  finishBy: string | null;
  /** `current` is the first unfinished phase — the one to be working on now. */
  state: "done" | "current" | "upcoming";
}

export type Pace = "done" | "on-track" | "behind" | "unknown" | "over";

export interface SprintPlan {
  /** Days from today to the deadline, both included; 0 once the deadline has passed. */
  daysLeft: number;
  hoursLeft: number;
  /** Hours a week needed to finish on time; null when no days are left. */
  hoursPerWeekNeeded: number | null;
  /** The finish date at the learner's stated hours, or null if they have not set any. */
  projectedFinish: string | null;
  /** Days between the projected finish and the deadline; negative means late. */
  daysToSpare: number | null;
  pace: Pace;
  phases: PhaseTarget[];
}

const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Today (or any instant) as the viewer's own local calendar date. */
export function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A `YYYY-MM-DD` date as a whole-day number, in UTC so no offset can shift it. */
function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!) / DAY_MS;
}

function fromDayNumber(day: number): string {
  const date = new Date(day * DAY_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(dayNumber(date) + days);
}

/**
 * Read a phase doc's `**Effort:**` line as a number of hours.
 *
 * "~25–40 hours" → 32.5 (the midpoint); "40+ hours" → 40 (the floor). Anything else falls
 * back, so a reworded effort line degrades the estimate instead of breaking the planner.
 */
export function effortHours(effort: string | undefined, fallback = 30): number {
  if (!effort) return fallback;
  const range = /(\d+)\s*[–—-]\s*(\d+)\s*hours?/i.exec(effort);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const single = /(\d+)\s*\+?\s*hours?/i.exec(effort);
  if (single) return Number(single[1]);
  return fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

/**
 * Plan the rest of the edition from today.
 *
 * Remaining days are shared out across unfinished phases in order, in proportion to the
 * hours each has left, so every phase gets a "finish by" date and the last one lands on the
 * deadline. Whether that is achievable is a separate question, answered by comparing the
 * hours a week it needs with the hours a week the learner says they have.
 */
export function planSprint(input: {
  today: string;
  deadline: string;
  phases: PhaseLoad[];
  hoursPerWeek: number | null;
}): SprintPlan {
  const { today, deadline, phases, hoursPerWeek } = input;

  const hoursLeftByPhase = phases.map((phase) => phase.effortHours * (1 - clamp01(phase.doneFraction)));
  const hoursLeft = hoursLeftByPhase.reduce((sum, hours) => sum + hours, 0);
  const daysLeft = Math.max(0, daysBetween(today, deadline) + 1);
  const allDone = phases.every((phase) => clamp01(phase.doneFraction) >= 1);

  let cumulative = 0;
  let currentAssigned = false;
  const targets: PhaseTarget[] = phases.map((phase, index) => {
    const left = hoursLeftByPhase[index]!;
    if (clamp01(phase.doneFraction) >= 1) {
      return { slug: phase.slug, title: phase.title, hoursLeft: 0, finishBy: null, state: "done" };
    }
    cumulative += left;
    const finishBy =
      daysLeft > 0 && hoursLeft > 0
        ? addDays(today, Math.max(1, Math.ceil((daysLeft * cumulative) / hoursLeft)) - 1)
        : null;
    const state = currentAssigned ? "upcoming" : "current";
    currentAssigned = true;
    return { slug: phase.slug, title: phase.title, hoursLeft: left, finishBy, state };
  });

  const hoursPerWeekNeeded = daysLeft > 0 ? (hoursLeft * 7) / daysLeft : null;

  let projectedFinish: string | null = null;
  let daysToSpare: number | null = null;
  if (hoursPerWeek && hoursPerWeek > 0 && hoursLeft > 0) {
    // `(h * 7) / perWeek`, not `h / (perWeek / 7)`: 4/7 is not exact in floating point, and
    // `ceil` would turn 70.00000000000001 into a phantom 71st day.
    const daysNeeded = Math.ceil((hoursLeft * 7) / hoursPerWeek - 1e-9);
    projectedFinish = addDays(today, daysNeeded - 1);
    daysToSpare = daysBetween(projectedFinish, deadline);
  }

  let pace: Pace;
  if (allDone) pace = "done";
  else if (daysLeft === 0) pace = "over";
  else if (daysToSpare === null) pace = "unknown";
  else pace = daysToSpare >= 0 ? "on-track" : "behind";

  return { daysLeft, hoursLeft, hoursPerWeekNeeded, projectedFinish, daysToSpare, pace, phases: targets };
}
