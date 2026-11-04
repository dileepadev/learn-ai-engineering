import { useEffect, useState } from "react";
import { href } from "../lib/href.ts";
import { phaseProgress, type PhaseCounts } from "../lib/curriculum.ts";
import { EDITION, EDITION_DEADLINE, NEXT_EDITION } from "../lib/edition.ts";
import { MAX_HOURS_PER_WEEK, setHoursPerWeek } from "../lib/progress.ts";
import { effortHours, planSprint, toLocalDate, type Pace } from "../lib/sprint.ts";
import { useHydrated, useProgress } from "../lib/useProgress.ts";

export interface SprintPhase {
  slug: string;
  number: string;
  title: string;
  effort?: string;
  counts: PhaseCounts;
}

const DEADLINE_YEAR = Number(EDITION_DEADLINE.slice(0, 4));

/** "Nov 13", or "Jan 12, 2027" once a date leaves the edition's year. */
function formatDate(localDate: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: year === DEADLINE_YEAR ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
}

function hours(value: number): string {
  return value >= 10 ? `${Math.round(value)}` : value.toFixed(1).replace(/\.0$/, "");
}

/**
 * The status colours are bright fills, too light to pass contrast as text on the light
 * theme — so the colour goes on a dot and the words stay in body ink.
 */
const PACE_COPY: Record<Pace, { dot: string; label: string }> = {
  done: { dot: "bg-done", label: "Edition complete" },
  "on-track": { dot: "bg-done", label: "On track at your hours" },
  behind: { dot: "bg-doing", label: "Behind at your hours — add time or test out what you know" },
  unknown: { dot: "bg-line-strong", label: "Set your hours a week to check your pace" },
  over: { dot: "bg-line-strong", label: "This edition's window has closed" },
};

/**
 * The 2026 sprint: a countdown to the edition deadline, the pace it takes, and a finish-by
 * date for every phase.
 *
 * `today` is read only after mount. The server has no idea what day it is for the viewer,
 * and rendering a date there would hydrate as a mismatch the moment the viewer's clock
 * disagrees.
 */
export function SprintPanel({ phases }: { phases: SprintPhase[] }) {
  const state = useProgress();
  const hydrated = useHydrated();
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(toLocalDate(new Date()));
  }, []);

  if (!hydrated || !today) {
    return <div className="mt-10 h-64 animate-pulse rounded-xl border border-line bg-sunken" />;
  }

  const plan = planSprint({
    today,
    deadline: EDITION_DEADLINE,
    hoursPerWeek: state.plan.hoursPerWeek,
    phases: phases.map((phase) => {
      const progress = phaseProgress(phase.slug, phase.counts, state);
      return {
        slug: phase.slug,
        title: phase.title,
        effortHours: effortHours(phase.effort),
        doneFraction: progress.total === 0 ? 0 : progress.done / progress.total,
      };
    }),
  });

  const pace = PACE_COPY[plan.pace];
  const numberBySlug = Object.fromEntries(phases.map((phase) => [phase.slug, phase.number]));

  return (
    <section
      className="mt-10 rounded-xl border border-line bg-raised p-5 sm:p-6"
      aria-labelledby="sprint-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {EDITION} sprint
          </p>
          <h2 id="sprint-heading" className="mt-1 text-xl font-semibold tracking-tight">
            Finish the {EDITION} edition by 31 December
          </h2>
          <p className="mt-1.5 inline-flex items-center gap-2 text-sm font-medium">
            <span className={`size-2 shrink-0 rounded-full ${pace.dot}`} aria-hidden="true" />
            {pace.label}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="text-4xl font-bold tabular-nums tracking-tight">{plan.daysLeft}</div>
          <div className="text-sm text-muted">{plan.daysLeft === 1 ? "day left" : "days left"}</div>
        </div>
      </div>

      {plan.pace === "over" ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The {EDITION} edition ran to 31 December. The {NEXT_EDITION} edition will be a new
          release with a refreshed curriculum —{" "}
          <a href={href("/progress")} className="text-accent hover:underline">
            export your progress
          </a>{" "}
          to keep a record of this one.
        </p>
      ) : (
        <>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-4">
              <dt className="text-xs text-muted">Work left</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">≈ {hours(plan.hoursLeft)} h</dd>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4">
              <dt className="text-xs text-muted">Pace needed</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {plan.hoursPerWeekNeeded === null ? "—" : `≈ ${hours(plan.hoursPerWeekNeeded)} h/week`}
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4">
              <dt className="text-xs text-muted">
                <label htmlFor="sprint-hours">Your hours a week</label>
              </dt>
              <dd className="mt-1 flex items-center gap-2">
                <input
                  id="sprint-hours"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_HOURS_PER_WEEK}
                  placeholder="e.g. 25"
                  value={state.plan.hoursPerWeek ?? ""}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setHoursPerWeek(Number.isNaN(value) ? null : value);
                  }}
                  className="w-20 rounded-md border border-line bg-raised px-2 py-1 text-lg font-semibold tabular-nums"
                />
                <span className="text-xs leading-snug text-muted">
                  {plan.projectedFinish && plan.daysToSpare !== null
                    ? plan.daysToSpare >= 0
                      ? `Done ${formatDate(plan.projectedFinish)} · ${plan.daysToSpare} days to spare`
                      : `Done ${formatDate(plan.projectedFinish)} · ${-plan.daysToSpare} days late`
                    : "Saved in this browser"}
                </span>
              </dd>
            </div>
          </dl>

          {/* grid-cols-1, not the implicit track: an implicit `auto` column grows to the
              widest title's min-content, and `truncate` never gets a chance to clip it. */}
          <ol className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plan.phases.map((phase) => (
              <li
                key={phase.slug}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  phase.state === "current" ? "border-accent/40 bg-accent-soft" : "border-line"
                }`}
              >
                <span className="font-mono text-xs text-faint">{numberBySlug[phase.slug]}</span>
                <a
                  href={href(`/phases/${phase.slug}`)}
                  className={`min-w-0 flex-1 truncate hover:underline ${
                    phase.state === "done" ? "text-muted line-through decoration-faint" : "font-medium"
                  }`}
                >
                  {phase.title}
                </a>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {phase.state === "done"
                    ? "Done"
                    : phase.finishBy
                      ? `${phase.state === "current" ? "Now · " : ""}by ${formatDate(phase.finishBy)}`
                      : "—"}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            Hours come from each phase’s effort budget, scaled by what you have ticked, so
            testing out of what you already know moves every date. The plan is recomputed
            from today each time you open this page.
          </p>
        </>
      )}
    </section>
  );
}
