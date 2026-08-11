import { href } from "../lib/href.ts";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { phaseProgress } from "../lib/curriculum.ts";
import { ProgressBar } from "./ProgressRing.tsx";

interface PhaseHeaderProps {
  slug: string;
  number: string;
  title: string;
  goal?: string;
  youBuild?: string;
  effort?: string;
  criteriaCount: number;
}

/**
 * The masthead of a phase page.
 *
 * The goal / you-build / effort lines are hoisted out of the markdown by the loader and
 * shown as structured facts rather than a bulleted paragraph — they are the three things
 * you want before deciding whether to start a phase.
 */
export function PhaseHeader({
  slug,
  number,
  title,
  goal,
  youBuild,
  effort,
  criteriaCount,
}: PhaseHeaderProps) {
  const state = useProgress();
  const hydrated = useHydrated();
  const progress = phaseProgress(slug, criteriaCount, state);

  return (
    <header>
      <a
        href={href("/")}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All phases
      </a>

      <p className="mt-5 font-mono text-sm text-accent">Phase {number}</p>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>

      <dl className="mt-6 space-y-3 rounded-xl border border-line bg-raised p-5 text-[0.95rem]">
        {goal ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-24 shrink-0 font-medium text-faint">Goal</dt>
            <dd className="leading-relaxed text-muted">{goal}</dd>
          </div>
        ) : null}
        {youBuild ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-24 shrink-0 font-medium text-faint">You build</dt>
            <dd className="leading-relaxed text-muted">{youBuild}</dd>
          </div>
        ) : null}
        {effort ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <dt className="w-24 shrink-0 font-medium text-faint">Effort</dt>
            <dd className="leading-relaxed text-muted">{effort}</dd>
          </div>
        ) : null}
      </dl>

      {hydrated && progress.total > 0 ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="tabular-nums text-muted">
              {progress.done}/{progress.total} {progress.unit} · {progress.percent}%
            </span>
          </div>
          <ProgressBar percent={progress.percent} status={progress.status} />
        </div>
      ) : null}
    </header>
  );
}
