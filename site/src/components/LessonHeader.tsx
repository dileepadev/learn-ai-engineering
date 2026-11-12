import { useEffect } from "react";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { markLessonRead, setTestedOut } from "../lib/progress.ts";
import { topics, topicProgress } from "../lib/curriculum.ts";
import { ProgressBar } from "./ProgressRing.tsx";
import { Breadcrumbs } from "./Breadcrumbs.tsx";
import { Celebration } from "./Celebration.tsx";
import { Pager } from "./Pager.tsx";

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
      <Breadcrumbs
        items={[
          { label: "Dashboard", route: "/" },
          { label: "Phase 1 · Foundations", route: "/phases/01-foundations" },
          { label: `Topic ${topic.number}` },
        ]}
      />

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
              {progress.testedOut
                ? "Tested out — counted as complete"
                : `${progress.done} of ${progress.total} drills complete`}
            </span>
            <a href="#drills" className="text-accent hover:underline">
              Jump to drills ↓
            </a>
          </div>
          <ProgressBar percent={progress.percent} status={progress.status} />
          {/*
            The fast path for an experienced learner. It is a separate fact from passing:
            drill results are untouched, so unticking restores exactly what was there.
          */}
          <label className="mt-3 inline-flex items-start gap-2.5 text-sm text-muted">
            <input
              id={`test-out-${topic.id}`}
              type="checkbox"
              checked={progress.testedOut}
              onChange={(event) => setTestedOut(topic.id, event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-accent"
            />
            <span>
              I already know this — test out.{" "}
              <span className="text-faint">
                Counts the topic as done; the drills stay here if you want them.
              </span>
            </span>
          </label>
        </div>
      ) : (
        <div className="mt-6 h-1.5 w-full animate-pulse rounded-full bg-sunken" />
      )}

      <Celebration status={progress.status} hydrated={hydrated} message={`Topic ${topic.number} complete. Nice work!`} />
    </header>
  );
}

/**
 * Previous/next links, so a learner can work straight through Part A without going back
 * to an index between every topic. Also bound to ←/→ (see `Pager`).
 */
export function LessonNav({ topicId }: { topicId: string }) {
  const index = topics.findIndex((topic) => topic.id === topicId);
  const previous = index > 0 ? topics[index - 1] : undefined;
  const next = index < topics.length - 1 ? topics[index + 1] : undefined;

  return (
    <Pager
      label="Lesson"
      previous={
        previous && {
          route: `/learn/${previous.lessonSlug}`,
          eyebrow: `Topic ${previous.number}`,
          title: previous.title,
        }
      }
      next={
        next
          ? { route: `/learn/${next.lessonSlug}`, eyebrow: `Topic ${next.number}`, title: next.title }
          : // After the last topic, the way on is back to the phase: Part B and the projects.
            { route: "/phases/01-foundations", eyebrow: "Part A done", title: "Back to Phase 1" }
      }
    />
  );
}
