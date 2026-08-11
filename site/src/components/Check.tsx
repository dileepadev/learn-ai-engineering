import { useState } from "react";
import { InlineMarkdown } from "./InlineMarkdown.tsx";
import { useProgress } from "../lib/useProgress.ts";
import { recordCheck } from "../lib/progress.ts";

export interface CheckOption {
  text: string;
  correct: boolean;
  explain: string;
}

export interface CheckData {
  id: string;
  lesson: string;
  index: number;
  kind: "mcq" | "predict";
  prompt: string;
  code?: string;
  options: CheckOption[];
  takeaway?: string;
}

const KIND_LABEL: Record<CheckData["kind"], string> = {
  mcq: "Check yourself",
  predict: "Predict the output",
};

/**
 * An inline comprehension check.
 *
 * Answering is never blocked and never "lost" — a wrong pick shows why it is wrong and
 * lets you try again, because the point is to correct a misconception in the moment
 * rather than to score anyone. Every option carries its own explanation, so picking the
 * wrong one teaches something specific rather than just saying "no".
 */
export function Check({ check }: { check: CheckData }) {
  const state = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const alreadyCorrect = Boolean(state.checks[check.id]?.correct);

  const chosen = picked === null ? null : check.options[picked];
  const revealed = chosen !== null;
  const isCorrect = chosen?.correct ?? false;

  const choose = (optionIndex: number): void => {
    setPicked(optionIndex);
    recordCheck(check.id, check.options[optionIndex]?.correct ?? false);
  };

  return (
    <aside
      className={`my-8 overflow-hidden rounded-xl border ${
        isCorrect || alreadyCorrect ? "border-done/40" : "border-line"
      } bg-raised`}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {KIND_LABEL[check.kind]}
        </span>
        {alreadyCorrect && !revealed ? (
          <span className="ml-auto text-xs text-done">Answered</span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="font-medium leading-relaxed">
          <InlineMarkdown text={check.prompt} />
        </p>

        {check.code ? (
          <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-sunken p-3 font-mono text-[0.8rem] leading-relaxed">
            {check.code}
          </pre>
        ) : null}

        <ul className="mt-4 space-y-2">
          {check.options.map((option, optionIndex) => {
            const selected = picked === optionIndex;
            const showAsCorrect = revealed && option.correct;
            const showAsWrong = selected && !option.correct;

            return (
              <li key={optionIndex}>
                <button
                  type="button"
                  onClick={() => choose(optionIndex)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-[0.925rem] transition-colors ${
                    showAsCorrect
                      ? "border-done/60 bg-done/10"
                      : showAsWrong
                        ? "border-red-500/50 bg-red-500/8"
                        : "border-line hover:border-line-strong hover:bg-sunken"
                  }`}
                >
                  <span className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      {showAsCorrect ? (
                        <svg viewBox="0 0 24 24" className="size-4 text-done" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M4 12.5l5.5 5.5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : showAsWrong ? (
                        <svg viewBox="0 0 24 24" className="size-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <span className="block size-4 rounded-full border border-line-strong" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <InlineMarkdown text={option.text} />
                      {revealed && (selected || option.correct) ? (
                        <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                          <InlineMarkdown text={option.explain} />
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {revealed ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!isCorrect ? (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-sunken"
              >
                Try again
              </button>
            ) : null}
            {isCorrect && check.takeaway ? (
              <p className="text-sm leading-relaxed text-muted">
                <InlineMarkdown text={check.takeaway} />
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

/** Renders every check authored for a lesson, in order. */
export function LessonChecks({ checks }: { checks: CheckData[] }) {
  if (checks.length === 0) return null;
  return (
    <section aria-label="Comprehension checks">
      {checks.map((check) => (
        <Check key={check.id} check={check} />
      ))}
    </section>
  );
}
