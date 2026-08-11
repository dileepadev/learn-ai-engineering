import { href } from "../lib/href.ts";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { ProgressRing, ProgressBar } from "./ProgressRing.tsx";
import {
  nextUp,
  overallProgress,
  phaseProgress,
  topicProgress,
  topics,
  type Status,
} from "../lib/curriculum.ts";

export interface PhaseMeta {
  slug: string;
  number: string;
  title: string;
  goal?: string;
  youBuild?: string;
  effort?: string;
  criteriaCount: number;
}

interface DashboardProps {
  phases: PhaseMeta[];
}

const STATUS_LABEL: Record<Status, string> = {
  complete: "Complete",
  "in-progress": "In progress",
  upcoming: "Not started",
};

const STATUS_DOT: Record<Status, string> = {
  complete: "bg-done",
  "in-progress": "bg-doing",
  upcoming: "bg-line-strong",
};

/**
 * Condense a phase's effort line to the hours it names.
 *
 * The docs write these as full sentences — Phase 1's is "~30–50 hours if Python is new
 * territory; a fraction of that as a refresher. Either way, don't skip the projects." —
 * which is right for a phase page and far too long for a card footer. The full text is
 * still shown in the phase header.
 */
function shortEffort(effort: string | undefined): string | undefined {
  if (!effort) return undefined;
  const hours = /~?\s*\d+\s*[–—-]?\s*\d*\s*hours?/i.exec(effort);
  return hours ? hours[0].replace(/\s+/g, " ").trim() : undefined;
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * The landing view.
 *
 * Ordered to answer the five questions a learner arrives with, top to bottom: what am I
 * learning, where am I, what next, what have I done, how far along am I overall. The
 * "Continue" card is the single loudest element on the page — the site should tell you
 * what to do, not present a menu and leave you to choose.
 */
export function Dashboard({ phases }: DashboardProps) {
  const state = useProgress();
  const hydrated = useHydrated();

  const criteriaCounts = Object.fromEntries(
    phases.map((phase) => [phase.slug, phase.criteriaCount]),
  );
  const overall = overallProgress(state, criteriaCounts);
  const next = nextUp(
    state,
    phases.map((phase) => phase.slug),
    criteriaCounts,
  );

  const started = overall.done > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* ---- Hero: what am I learning, and how far along am I ---- */}
      <section className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">Interactive roadmap</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Learn AI engineering by building
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Eight phases, from Python fundamentals to a deployed capstone. Phase 1 runs
            entirely in your browser — read the lesson, write the code, and the real pytest
            suite grades it here. No setup, no API keys.
          </p>
        </div>

        {hydrated ? (
          <ProgressRing
            percent={overall.percent}
            label={`${overall.percent}%`}
            sublabel={`${overall.done} / ${overall.total}`}
          />
        ) : (
          <div className="size-33 shrink-0 animate-pulse rounded-full bg-sunken" />
        )}
      </section>

      {/* ---- The single next action ---- */}
      {next ? (
        <a
          href={href(next.href)}
          className="group mt-10 flex items-center gap-4 rounded-xl border border-accent/30 bg-accent-soft p-5 transition-colors hover:border-accent/60"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-accent">
              {started ? "Continue where you left off" : "Start here"}
            </span>
            <span className="mt-0.5 block truncate font-semibold">{next.label}</span>
            <span className="block text-sm text-muted">{next.detail}</span>
          </span>
          <span className="ml-auto hidden shrink-0 text-sm font-medium text-accent group-hover:underline sm:block">
            Open →
          </span>
        </a>
      ) : (
        <div className="mt-10 rounded-xl border border-line bg-raised p-5">
          <p className="font-semibold">Everything is complete. 🎉</p>
          <p className="mt-1 text-sm text-muted">
            All eight phases are ticked off. Time to build something of your own.
          </p>
        </div>
      )}

      {/* ---- Phase 1 topic strip: what have I done, what remains ---- */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Phase 1 · Part A</h2>
          <a
            href={href("/phases/01-foundations")}
            className="text-sm text-accent hover:underline"
          >
            Phase overview →
          </a>
        </div>
        <p className="mt-1 text-sm text-muted">
          Twelve topics. Read, then make the tests pass — in the browser.
        </p>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const progress = topicProgress(topic, state);
            return (
              <li key={topic.id}>
                <a
                  href={href(`/learn/${topic.lessonSlug}`)}
                  className="flex h-full flex-col gap-2.5 rounded-lg border border-line bg-raised p-4 transition-all hover:border-line-strong hover:shadow-(--shadow)"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-xs text-faint">{topic.number}</span>
                    <span className="flex-1 font-medium leading-snug">{topic.title}</span>
                    {progress.status === "complete" ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4 shrink-0 text-done"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-label="Complete"
                      >
                        <path d="M4 12.5l5.5 5.5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </div>
                  <ProgressBar percent={progress.percent} status={progress.status} />
                  <div className="flex items-center justify-between text-xs text-faint">
                    <span className="tabular-nums">
                      {progress.done}/{progress.total} drills
                    </span>
                    {topic.graded ? null : <span>self-assessed</span>}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---- All eight phases: the whole journey ---- */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight">The roadmap</h2>
        <p className="mt-1 text-sm text-muted">
          Phases 2–8 track their exit criteria. Lessons appear as they are written.
        </p>

        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {phases.map((phase) => {
            const progress = phaseProgress(phase.slug, phase.criteriaCount, state);
            return (
              <li key={phase.slug}>
                <a
                  href={href(`/phases/${phase.slug}`)}
                  className="flex h-full flex-col rounded-xl border border-line bg-raised p-5 transition-all hover:border-line-strong hover:shadow-(--shadow)"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken font-mono text-sm font-semibold text-muted">
                      {phase.number}
                    </span>
                    <h3 className="flex-1 font-semibold leading-tight">{phase.title}</h3>
                    <StatusPill status={progress.status} />
                  </div>

                  {phase.goal ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                      {phase.goal}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4">
                    <ProgressBar percent={progress.percent} status={progress.status} />
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-faint">
                      <span className="tabular-nums">
                        {progress.done}/{progress.total} {progress.unit}
                      </span>
                      {shortEffort(phase.effort) ? (
                        <span className="shrink-0">{shortEffort(phase.effort)}</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
