import { useEffect, useRef, useState } from "react";
import { href, isSamePath as samePath } from "../lib/href.ts";
import { useHydrated, useProgress } from "../lib/useProgress.ts";
import { usePhaseCounts } from "../lib/phaseCounts.ts";
import { NO_COUNTS, PHASE_WITH_LESSONS, phaseProgress, topicProgress, topics } from "../lib/curriculum.ts";
import { StatusIcon } from "./StatusIcon.tsx";

/** What the nav needs about a phase. Titles and links only: counts come from `usePhaseCounts`. */
export interface NavPhase {
  slug: string;
  number: string;
  title: string;
}

interface CourseNavProps {
  phases: NavPhase[];
  /** The current page's path, base included, without a trailing slash. */
  currentPath: string;
  /**
   * Prefix for element ids. The nav can appear twice on one page (sidebar and mobile menu)
   * and ids must stay unique, or `aria-labelledby` points at the wrong label.
   */
  idPrefix: string;
}

/**
 * The whole course as a tree: eight phases, with Phase 1's twelve topics nested under it.
 *
 * Answers "where am I, and what's around me?" from any reading page, which is what the
 * old header (a "Phases" link that always opened Phase 1) could not. The Part A topics
 * fold away by default and open on their own when you are on Phase 1 or a lesson, so the
 * list stays short until you are in that part of the course.
 *
 * Group labels are `<p>` + `aria-labelledby`, not headings. Headings here would land
 * before each page's `<h1>` in the outline, which the page audit rejects.
 */
export function CourseNav({ phases, currentPath, idPrefix }: CourseNavProps) {
  const state = useProgress();
  const hydrated = useHydrated();
  const counts = usePhaseCounts();

  const inPartA =
    samePath(currentPath, href(`/phases/${PHASE_WITH_LESSONS}`)) ||
    topics.some((topic) => samePath(currentPath, href(`/learn/${topic.lessonSlug}`)));
  const [topicsOpen, setTopicsOpen] = useState(inPartA);

  // Bring the current page into view inside the sidebar's own scroll area. The scroll
  // offset is set directly rather than with `scrollIntoView()`, which would also scroll
  // the window and make the page jump on load.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    const scroller = nav?.closest<HTMLElement>("[data-scroll-container]");
    if (!active || !scroller) return;
    const offset = active.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    if (offset < 0 || offset > scroller.clientHeight - 48) {
      scroller.scrollTop += offset - scroller.clientHeight / 3;
    }
  }, []);

  const labelId = `${idPrefix}-course-label`;
  const topicsId = `${idPrefix}-part-a-topics`;

  return (
    <nav ref={navRef} aria-labelledby={labelId} className="text-sm">
      <p id={labelId} className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-faint">
        Roadmap
      </p>
      <ol className="space-y-0.5">
        {phases.map((phase) => {
          const phaseHref = href(`/phases/${phase.slug}`);
          const current = samePath(currentPath, phaseHref);
          const progress = phaseProgress(phase.slug, counts[phase.slug] ?? NO_COUNTS, state);
          const hasTopics = phase.slug === PHASE_WITH_LESSONS;

          return (
            <li key={phase.slug}>
              <div className="flex items-center gap-1">
                <a
                  href={phaseHref}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-w-0 flex-1 items-start gap-2.5 rounded-md px-2 py-1.5 leading-snug transition-colors ${
                    current
                      ? "bg-accent-soft font-medium text-ink"
                      : "text-muted hover:bg-sunken hover:text-ink"
                  }`}
                >
                  {/* Titles wrap rather than truncate: "Prompt Engineering & Struct…" hid the
                      half of the name that says what the phase is. Icon and number sit on
                      the first line, so a two-line title still reads as one row. */}
                  <StatusIcon status={hydrated ? progress.status : null} className="mt-0.5 size-4" />
                  <span className="mt-px font-mono text-xs text-faint">{phase.number}</span>
                  <span className="min-w-0">{phase.title}</span>
                </a>
                {hasTopics ? (
                  <button
                    type="button"
                    onClick={() => setTopicsOpen((open) => !open)}
                    aria-expanded={topicsOpen}
                    aria-controls={topicsId}
                    aria-label={topicsOpen ? "Hide Part A topics" : "Show Part A topics"}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-sunken hover:text-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`size-3.5 transition-transform ${topicsOpen ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
              </div>

              {hasTopics && topicsOpen ? (
                <ol id={topicsId} className="ml-[1.1rem] mt-0.5 space-y-0.5 border-l border-line pl-2">
                  {topics.map((topic) => {
                    const topicHref = href(`/learn/${topic.lessonSlug}`);
                    const currentTopic = samePath(currentPath, topicHref);
                    const status = hydrated ? topicProgress(topic, state).status : null;
                    return (
                      <li key={topic.id}>
                        <a
                          href={topicHref}
                          aria-current={currentTopic ? "page" : undefined}
                          className={`flex items-start gap-2 rounded-md px-2 py-1 text-xs leading-snug transition-colors ${
                            currentTopic
                              ? "bg-accent-soft font-medium text-ink"
                              : "text-muted hover:bg-sunken hover:text-ink"
                          }`}
                        >
                          <StatusIcon status={status} className="mt-0.5 size-3.5" />
                          <span className="font-mono text-[0.8125rem] text-faint">{topic.number}</span>
                          <span className="min-w-0">{topic.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
