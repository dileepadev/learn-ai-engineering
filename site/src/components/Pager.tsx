import { useEffect } from "react";
import { href } from "../lib/href.ts";
import { shouldHandleArrowNavigation } from "../lib/keys.ts";

export interface PagerLink {
  route: string;
  /** "Topic 04", "Phase 3". */
  eyebrow: string;
  title: string;
}

interface PagerProps {
  previous?: PagerLink;
  next?: PagerLink;
  /** For the landmark name: "Lesson" or "Phase". */
  label: string;
}

function Kbd({ children }: { children: string }) {
  return <kbd className="kbd hidden sm:inline-grid">{children}</kbd>;
}

/**
 * Previous/next cards at the end of a lesson or phase, also bound to `←` and `→`.
 *
 * The keys go through `shouldHandleArrowNavigation`, which is what stops `→` in the drill
 * editor, or in a focused wide table, from navigating away mid-edit. Hydrate this
 * `client:idle`, not `client:visible`: the cards sit at the very bottom, and a
 * visible-only island would leave the shortcuts dead until the learner scrolled there.
 */
export function Pager({ previous, next, label }: PagerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!shouldHandleArrowNavigation(event)) return;
      const target = event.key === "ArrowLeft" ? previous : next;
      if (!target) return;
      event.preventDefault();
      window.location.assign(href(target.route));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previous, next]);

  return (
    <nav className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label={label}>
      {previous ? (
        <a href={href(previous.route)} rel="prev" className="card-interactive group rounded-xl border border-line bg-raised p-4">
          <span className="flex items-center gap-2 text-xs text-faint">
            <Kbd>←</Kbd> Previous · {previous.eyebrow}
          </span>
          <span className="mt-1 block font-medium group-hover:text-accent">{previous.title}</span>
        </a>
      ) : (
        <span className="hidden sm:block" />
      )}

      {next ? (
        <a href={href(next.route)} rel="next" className="card-interactive group rounded-xl border border-line bg-raised p-4 text-right sm:col-start-2">
          <span className="flex items-center justify-end gap-2 text-xs text-faint">
            Next · {next.eyebrow} <Kbd>→</Kbd>
          </span>
          <span className="mt-1 block font-medium group-hover:text-accent">{next.title}</span>
        </a>
      ) : null}
    </nav>
  );
}
