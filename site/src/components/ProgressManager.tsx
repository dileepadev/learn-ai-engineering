import { useRef, useState } from "react";
import { useProgress, useHydrated } from "../lib/useProgress.ts";
import { exportState, importState, resetAll } from "../lib/progress.ts";
import { topics, topicProgress, TOTAL_EXERCISES } from "../lib/curriculum.ts";

/**
 * Export, import, and reset.
 *
 * There is no account system by design, which means progress lives in one browser's
 * localStorage and a cleared cache takes it with it. A download button is the whole
 * backup story, so it needs to be obvious and it needs to round-trip exactly.
 */
export function ProgressManager() {
  const state = useProgress();
  const hydrated = useHydrated();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exercisesDone = topics.reduce((sum, topic) => sum + topicProgress(topic, state).done, 0);
  const criteriaDone = Object.keys(state.criteria).length;

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
      <h1 className="text-3xl font-bold tracking-tight">Your progress</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Everything you do is stored in this browser only — there is no account and nothing
        is sent anywhere. That also means clearing site data erases it, so export a copy if
        you care about it.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4">
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
            <span className="text-lg font-normal text-faint"> / 47</span>
          </dd>
        </div>
      </dl>

      <div className="mt-8 space-y-3">
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

      <div className="mt-12 rounded-xl border border-red-500/30 p-5">
        <h2 className="font-semibold">Reset everything</h2>
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
    </div>
  );
}
