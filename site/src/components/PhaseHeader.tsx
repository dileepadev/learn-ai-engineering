import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { describeBreakdown, phaseProgress, type PhaseCounts } from "../lib/curriculum.ts";
import { ProgressBar } from "./ProgressRing.tsx";
import { Breadcrumbs } from "./Breadcrumbs.tsx";
import { Celebration } from "./Celebration.tsx";

interface PhaseHeaderProps {
  slug: string;
  number: string;
  title: string;
  goal?: string;
  youBuild?: string;
  effort?: string;
  counts: PhaseCounts;
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
  counts,
}: PhaseHeaderProps) {
  const state = useProgress();
  const hydrated = useHydrated();
  const progress = phaseProgress(slug, counts, state);

  return (
    <header>
      <Breadcrumbs
        items={[
          { label: "Dashboard", route: "/" },
          { label: "Roadmap", route: "/#roadmap" },
          { label: `Phase ${Number(number)}` },
        ]}
      />

      <p className="mt-5 font-mono text-sm text-accent">Phase {number}</p>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>

      <dl className="mt-6 space-y-3 rounded-xl border border-line bg-raised p-5 text-base">
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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">Progress · {progress.percent}%</span>
            <span className="tabular-nums text-muted">{describeBreakdown(progress)}</span>
          </div>
          <ProgressBar percent={progress.percent} status={progress.status} />
          <p className="mt-2 text-xs text-faint">
            Tick each part below as you cover it. Every bullet, project step, and resource
            counts, and each section has a one-click “mark section done”.
          </p>
        </div>
      ) : null}

      <Celebration status={progress.status} hydrated={hydrated} message={`Phase ${Number(number)} complete. Well done!`} />
    </header>
  );
}
