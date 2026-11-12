import { href } from "../lib/href.ts";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { usePhaseCounts } from "../lib/phaseCounts.ts";
import { overallProgress } from "../lib/curriculum.ts";

/**
 * The header's "Progress" button: a labelled link to the page that shows how far along you are.
 *
 * It used to be a bare mini-bar and a percentage, shown only from 1024px up. Nothing said
 * it was clickable or where it went, and on phones and tablets it was not there at all, so
 * people could not find their progress. Now it carries the word "Progress", looks like the
 * button it is, and appears at every width, as the one header item that never moves into the menu.
 *
 * **Same box before and after hydration.** Progress lives in localStorage, so the server
 * cannot render the number. Every part of this has a fixed size (the percentage slot is a
 * fixed `w-9` so "9%" and "100%" take the same room), which means hydration only fills the
 * bar and the number in, and the Search button and nav links never jump (see the note
 * on `ThemeToggle` for the same reasoning applied to the icon).
 */
export function HeaderProgress({ current = false }: { current?: boolean }) {
  const state = useProgress();
  const hydrated = useHydrated();
  const { percent, done, total } = overallProgress(state, usePhaseCounts());

  return (
    <a
      href={href("/progress")}
      aria-current={current ? "page" : undefined}
      className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors hover:border-line-strong hover:bg-sunken sm:px-3 ${
        current ? "border-accent/50 bg-accent-soft" : "border-line"
      }`}
      title={
        hydrated
          ? `${done} of ${total} items complete. See your full progress`
          : "See your progress"
      }
    >
      <span className="font-medium text-ink">Progress</span>
      {/* The bar is a nicety; from `xl` up there is room for it. The number is what matters. */}
      <span className="hidden h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-sunken xl:block" aria-hidden="true">
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: hydrated ? `${percent}%` : "0%" }}
        />
      </span>
      <span className="w-9 text-right font-semibold tabular-nums text-accent">
        {hydrated ? `${percent}%` : null}
      </span>
    </a>
  );
}
