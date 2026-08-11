import { href } from "../lib/href.ts";
import { useProgress } from "../lib/useProgress.ts";
import { topics, topicProgress } from "../lib/curriculum.ts";
import { ProgressBar } from "./ProgressRing.tsx";

/**
 * The twelve Part A topics, in order, with live status.
 *
 * Shown on the Phase 1 page in place of the `part-a/README.md` table it replaces — same
 * information, but each row knows whether you have finished it.
 */
export function PartATopicList() {
  const state = useProgress();

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">Part A — the twelve topics</h2>
      <p className="mt-1 text-sm text-muted">
        Read the lesson, then make the tests pass. Everything runs in this browser.
      </p>

      <ol className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
        {topics.map((topic) => {
          const progress = topicProgress(topic, state);
          const complete = progress.status === "complete";
          return (
            <li key={topic.id}>
              <a
                href={href(`/learn/${topic.lessonSlug}`)}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-sunken"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs ${
                    complete
                      ? "bg-done text-white"
                      : progress.status === "in-progress"
                        ? "bg-doing text-black"
                        : "bg-sunken text-faint"
                  }`}
                >
                  {complete ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                      <path d="M4 12.5l5.5 5.5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    topic.number
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{topic.title}</span>
                  <span className="mt-1 block max-w-48">
                    <ProgressBar percent={progress.percent} status={progress.status} />
                  </span>
                </span>

                <span className="shrink-0 text-xs tabular-nums text-faint">
                  {progress.done}/{progress.total}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
