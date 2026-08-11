import { useEffect } from "react";
import { href } from "../lib/href.ts";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { markLessonRead } from "../lib/progress.ts";
import { topics, topicProgress } from "../lib/curriculum.ts";
import { ProgressBar } from "./ProgressRing.tsx";

interface LessonHeaderProps {
  topicId: string;
  lessonSlug: string;
}

/**
 * A lesson's masthead, and the place where "I opened this" gets recorded.
 *
 * Marking the lesson read on mount is what lets the dashboard resume you here, and what
 * moves a topic from "upcoming" to "in progress" before any drill passes — so opening a
 * long lesson registers as progress rather than looking like nothing happened.
 */
export function LessonHeader({ topicId, lessonSlug }: LessonHeaderProps) {
  const state = useProgress();
  const hydrated = useHydrated();

  const index = topics.findIndex((topic) => topic.id === topicId);
  const topic = topics[index];

  useEffect(() => {
    markLessonRead(lessonSlug);
  }, [lessonSlug]);

  if (!topic) return null;
  const progress = topicProgress(topic, state);

  return (
    <header>
      <a
        href={href("/phases/01-foundations")}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Phase 1 · Foundations
      </a>

      <div className="mt-5 flex items-baseline gap-3">
        <span className="font-mono text-sm text-accent">Topic {topic.number}</span>
        <span className="text-sm text-faint">
          {index + 1} of {topics.length}
        </span>
      </div>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">{topic.title}</h1>

      {hydrated ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted">
              {progress.done} of {progress.total} drills complete
            </span>
            <a href="#drills" className="text-accent hover:underline">
              Jump to drills ↓
            </a>
          </div>
          <ProgressBar percent={progress.percent} status={progress.status} />
        </div>
      ) : (
        <div className="mt-6 h-1.5 w-full animate-pulse rounded-full bg-sunken" />
      )}
    </header>
  );
}

/**
 * Previous/next links, so a learner can work straight through Part A without going back
 * to an index between every topic.
 */
export function LessonNav({ topicId }: { topicId: string }) {
  const index = topics.findIndex((topic) => topic.id === topicId);
  const previous = index > 0 ? topics[index - 1] : undefined;
  const next = index < topics.length - 1 ? topics[index + 1] : undefined;

  return (
    <nav className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label="Lesson">
      {previous ? (
        <a
          href={href(`/learn/${previous.lessonSlug}`)}
          className="rounded-xl border border-line bg-raised p-4 transition-colors hover:border-line-strong"
        >
          <span className="text-xs text-faint">← Previous</span>
          <span className="mt-1 block font-medium">
            {previous.number} — {previous.title}
          </span>
        </a>
      ) : (
        <span />
      )}

      {next ? (
        <a
          href={href(`/learn/${next.lessonSlug}`)}
          className="rounded-xl border border-line bg-raised p-4 text-right transition-colors hover:border-line-strong sm:col-start-2"
        >
          <span className="text-xs text-faint">Next →</span>
          <span className="mt-1 block font-medium">
            {next.number} — {next.title}
          </span>
        </a>
      ) : (
        <a
          href={href("/phases/01-foundations")}
          className="rounded-xl border border-line bg-raised p-4 text-right transition-colors hover:border-line-strong sm:col-start-2"
        >
          <span className="text-xs text-faint">Next →</span>
          <span className="mt-1 block font-medium">Back to Phase 1</span>
        </a>
      )}
    </nav>
  );
}
