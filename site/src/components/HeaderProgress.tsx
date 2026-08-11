import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { overallProgress } from "../lib/curriculum.ts";

interface HeaderProgressProps {
  criteriaCounts: Record<string, number>;
}

/**
 * A compact overall-progress readout, always visible in the header.
 *
 * Its job is to answer "how much progress have I made?" from any page without a trip back
 * to the dashboard. Hidden on narrow screens, where the space belongs to navigation.
 */
export function HeaderProgress({ criteriaCounts }: HeaderProgressProps) {
  const state = useProgress();
  const hydrated = useHydrated();
  const { percent, done, total } = overallProgress(state, criteriaCounts);

  if (!hydrated) {
    return <div className="ml-2 hidden h-8 w-28 animate-pulse rounded-md bg-sunken sm:block" />;
  }

  return (
    <div
      className="ml-2 hidden items-center gap-2.5 rounded-md border border-line px-3 py-1.5 sm:flex"
      title={`${done} of ${total} items complete across the roadmap`}
    >
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted">{percent}%</span>
    </div>
  );
}
