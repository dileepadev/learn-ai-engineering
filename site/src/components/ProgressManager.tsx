import { useRef, useState } from "react";
import { href } from "../lib/href.ts";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { exportState, importState, resetAll } from "../lib/progress.ts";
import {
  describeBreakdown,
  nextUp,
  overallProgress,
  phaseProgress,
  topics,
  topicProgress,
  TOTAL_EXERCISES,
} from "../lib/curriculum.ts";
import type { PhaseMeta } from "./Dashboard.tsx";
import { Breadcrumbs } from "./Breadcrumbs.tsx";
import { ProgressBar, ProgressRing } from "./ProgressRing.tsx";
import { StatusIcon } from "./StatusIcon.tsx";

/**
 * The progress page: how far along you are, phase by phase, and how to back it up.
 *
 * It began as an export/import/reset page and showed four totals, so people who came to
 * *see* their progress found settings instead. It now leads with the answer to "how am I
 * doing?" (an overall ring, the next thing to do, and a bar for each phase) and puts the
 * backup controls underneath.
 *
 * There is no account system by design, which means progress lives in one browser's
 * localStorage and a cleared cache takes it with it. A download button is the whole
 * backup story, so it needs to be obvious and it needs to round-trip exactly.
 */
interface ProgressManagerProps {
  /** All eight phases with their part keys and criteria counts, from build time. */
  phases: PhaseMeta[];
}

export function ProgressManager({ phases }: ProgressManagerProps) {
  const state = useProgress();
  const hydrated = useHydrated();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Every current part key, so a retired key left in storage is not counted (see parts.ts).
  const partKeys = phases.flatMap((phase) => phase.counts.parts);
  const criteriaTotal = phases.reduce((sum, phase) => sum + phase.counts.criteria, 0);
  const counts = Object.fromEntries(phases.map((phase) => [phase.slug, phase.counts]));
  const overall = overallProgress(state, counts);
  const next = nextUp(state, phases.map((phase) => phase.slug), counts);

  // "Passed" means passed: a tested-out topic counts toward progress elsewhere, but its
  // drills were never run, so they are not reported here as passed.
  const exercisesDone = topics.reduce((sum, topic) => {
    const progress = topicProgress(topic, state);
    return progress.testedOut ? sum : sum + progress.done;
  }, 0);
  const testedOutCount = topics.filter((topic) => state.testedOut[topic.id]).length;
  const criteriaDone = Object.keys(state.criteria).length;
  const partsDone = partKeys.filter((key) => state.parts[key]).length;

  const download = (): void => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    link.download = `learn-ai-engineering-progress-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "ok", text: "Progress file downloaded." });
  };

  const upload = async (file: File): Promise<void> => {
    const text = await file.text();
    if (importState(text)) {
      setMessage({ tone: "ok", text: "Progress restored from file." });
    } else {
      setMessage({ tone: "bad", text: "That file is not a valid progress export." });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Breadcrumbs items={[{ label: "Dashboard", route: "/" }, { label: "Your progress" }]} />
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Your progress</h1>

      {/* ---- The answer first: how far along am I, and what next ---- */}
      <section
        aria-label="Overall progress"
        className="mt-6 flex flex-col items-center gap-6 rounded-xl border border-line bg-raised p-6 sm:flex-row"
      >
        {hydrated ? (
          <ProgressRing
            percent={overall.percent}
            label={`${overall.percent}%`}
            sublabel={`${overall.done} / ${overall.total}`}
          />
        ) : (
          <div className="size-33 shrink-0 animate-pulse rounded-full bg-sunken" />
        )}
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-lg font-semibold">
            {hydrated ? `${overall.done} of ${overall.total} items complete` : "Loading your progress…"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Every skill, project step, and resource you tick counts, as do exit criteria and,
            in Phase 1, each drill you pass.
          </p>
          {hydrated && next ? (
            <a
              href={href(next.href)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              {overall.done > 0 ? "Continue" : "Start"}: {next.label} →
            </a>
          ) : null}
        </div>
      </section>

      {/* ---- Each phase: where the work is ---- */}
      <section className="mt-10" aria-labelledby="by-phase">
        <h2 id="by-phase" className="text-xl font-semibold tracking-tight">
          By phase
        </h2>
        <ol className="mt-4 space-y-3">
          {phases.map((phase) => {
            const progress = phaseProgress(phase.slug, phase.counts, state);
            return (
              <li key={phase.slug}>
                <a
                  href={href(`/phases/${phase.slug}`)}
                  className="card-interactive block rounded-xl border border-line bg-raised p-4"
                >
                  <span className="flex items-center gap-3">
                    <StatusIcon status={hydrated ? progress.status : null} className="size-5" />
                    <span className="font-mono text-sm text-faint">{phase.number}</span>
                    <span className="min-w-0 flex-1 truncate font-medium" title={phase.title}>
                      {phase.title}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {hydrated ? `${progress.percent}%` : "—"}
                    </span>
                  </span>
                  <ProgressBar
                    className="mt-3"
                    percent={hydrated ? progress.percent : 0}
                    status={hydrated ? progress.status : "upcoming"}
                  />
                  <span className="mt-2 block text-sm tabular-nums text-muted">
                    {hydrated ? describeBreakdown(progress) : " "}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---- The detail behind the numbers ---- */}
      <section className="mt-10" aria-labelledby="details">
        <h2 id="details" className="text-xl font-semibold tracking-tight">
          The details
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-raised p-5">
            <dt className="text-sm text-muted">Drills passed</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {hydrated ? exercisesDone : "—"}
              <span className="text-lg font-normal text-faint"> / {TOTAL_EXERCISES}</span>
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-raised p-5">
            <dt className="text-sm text-muted">Exit criteria ticked</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {hydrated ? criteriaDone : "—"}
              <span className="text-lg font-normal text-faint"> / {criteriaTotal}</span>
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-raised p-5">
            <dt className="text-sm text-muted">Parts ticked</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {hydrated ? partsDone : "—"}
              <span className="text-lg font-normal text-faint"> / {partKeys.length}</span>
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-raised p-5">
            <dt className="text-sm text-muted">Part A topics tested out</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {hydrated ? testedOutCount : "—"}
              <span className="text-lg font-normal text-faint"> / {topics.length}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ---- Keeping it safe ---- */}
      <section className="mt-12" aria-labelledby="backup">
        <h2 id="backup" className="text-xl font-semibold tracking-tight">
          Back up or reset
        </h2>
        <p className="mt-2 leading-relaxed text-muted">
          Everything you do is stored in this browser only — there is no account and nothing
          is sent anywhere. That also means clearing site data erases it, so export a copy if
          you care about it.
        </p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={download}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
          >
            Export progress as JSON
          </button>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="w-full rounded-lg border border-line bg-raised px-4 py-2.5 text-sm font-semibold transition-colors hover:border-line-strong"
          >
            Import from a file
          </button>
          {/*
            Visually hidden and driven by the button above, but it is still a real form
            control in the accessibility tree — so it needs its own name.
          */}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            aria-label="Choose a progress JSON file to import"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
        </div>

        {message ? (
          <p
            className={`mt-4 rounded-lg border p-3 text-sm ${
              message.tone === "ok"
                ? "border-done/40 text-done"
                : "border-red-500/40 text-red-500"
            }`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-red-500/30 p-5">
          <h3 className="font-semibold">Reset everything</h3>
          <p className="mt-1 text-sm text-muted">
            Clears every drill, draft, and ticked criterion. This cannot be undone — export
            first if you might want it back.
          </p>
          {confirmingReset ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setConfirmingReset(false);
                  setMessage({ tone: "ok", text: "All progress cleared." });
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Yes, erase everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-sunken"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="mt-4 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              Reset all progress
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
