import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { criterionKey } from "../lib/curriculum.ts";
import { setCriterion } from "../lib/progress.ts";
import { InlineMarkdown } from "./InlineMarkdown.tsx";

interface Criterion {
  index: number;
  text: string;
}

interface ExitCriteriaProps {
  phaseSlug: string;
  criteria: Criterion[];
  /** The doc's own heading — "Done means" on the capstone, "Exit criteria" elsewhere. */
  heading?: string;
}

/**
 * The phase's exit criteria, as a checklist you can actually tick.
 *
 * In the source markdown these are `- [ ]` items — permanently unchecked, because nothing
 * writes to a file you are reading on GitHub. Making them stateful is what turns a phase
 * page into a tracker, and for phases 2-8 it is the only progress signal that exists.
 *
 * These are self-assessed by design. The criteria are things like "I can explain prompt
 * caching to a junior engineer", which no test can score.
 */
export function ExitCriteria({ phaseSlug, criteria, heading = "Exit criteria" }: ExitCriteriaProps) {
  const state = useProgress();
  const hydrated = useHydrated();

  const done = criteria.filter((c) => state.criteria[criterionKey(phaseSlug, c.index)]).length;

  return (
    <section className="mt-12 rounded-xl border border-line bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <span className="text-sm tabular-nums text-muted">
          {hydrated ? `${done} of ${criteria.length} ticked` : `${criteria.length} criteria`}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        Honest self-assessment. Tick one when you could do it unaided, not when you have
        read about it.
      </p>

      <ul className="mt-5 space-y-1">
        {criteria.map((criterion) => {
          const key = criterionKey(phaseSlug, criterion.index);
          const checked = Boolean(state.criteria[key]);
          return (
            <li key={criterion.index}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-sunken ${
                  checked ? "text-muted" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => setCriterion(key, event.target.checked)}
                  className="mt-1 size-4 shrink-0 cursor-pointer accent-accent"
                />
                <span className={`text-[0.95rem] leading-relaxed ${checked ? "line-through decoration-faint" : ""}`}>
                  <InlineMarkdown text={criterion.text} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
