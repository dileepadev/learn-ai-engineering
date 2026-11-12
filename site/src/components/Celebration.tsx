import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Status } from "../lib/curriculum.ts";

interface CelebrationProps {
  /** The live status of the topic or phase being watched. */
  status: Status;
  /** False until progress has loaded from localStorage. */
  hydrated: boolean;
  /** What to say, e.g. "Topic 03 complete". */
  message: string;
}

/** Twelve pieces, at fixed angles, so it looks the same every time and is easy to test by eye. */
const PIECES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 56 + (i % 3) * 18;
  return {
    dx: `${Math.round(Math.cos(angle) * distance)}px`,
    dy: `${Math.round(Math.sin(angle) * distance - 20)}px`,
    rot: `${(i % 2 ? 1 : -1) * (120 + i * 25)}deg`,
    color: ["var(--accent)", "var(--color-done)", "var(--color-doing)"][i % 3],
  };
});

const SHOW_FOR_MS = 4500;

/**
 * A short "well done" when something *becomes* complete while you are on the page.
 *
 * The rule that matters: celebrate the transition, not the state. The first status seen
 * after hydration is only recorded, so reopening a phase finished last week stays quiet.
 * Without that, every visit to a finished page would celebrate, and the feedback would
 * stop meaning anything.
 *
 * The live region (`role="status"`) is always in the DOM and only its contents change.
 * Screen readers announce changes to an existing live region; a region inserted
 * together with its text is often not read at all.
 */
export function Celebration({ status, hydrated, message }: CelebrationProps) {
  const previous = useRef<Status | null>(null);
  const [visible, setVisible] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const before = previous.current;
    previous.current = status;
    // Unticking hides it at once. This can't be left to the timer: re-running this effect
    // cancels the previous run's timer, which would leave the toast up indefinitely.
    if (status !== "complete") {
      setVisible(false);
      return;
    }
    if (before === null || before === "complete") return;

    setVisible(true);
    // The burst is pure decoration; skip it entirely for reduced motion, not just shorten it.
    setBurst(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const timer = window.setTimeout(() => setVisible(false), SHOW_FOR_MS);
    return () => window.clearTimeout(timer);
  }, [status, hydrated]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {visible ? (
        <div className="toast-in relative flex items-center gap-3 rounded-full border border-done/40 bg-raised px-5 py-3 text-sm font-medium shadow-(--shadow)">
          {burst
            ? PIECES.map((piece, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="confetti absolute left-1/2 top-1/2 size-2 rounded-sm"
                  style={
                    {
                      "--dx": piece.dx,
                      "--dy": piece.dy,
                      "--rot": piece.rot,
                      backgroundColor: piece.color,
                    } as CSSProperties
                  }
                />
              ))
            : null}
          <span className="grid size-6 place-items-center rounded-full bg-done text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {message}
        </div>
      ) : null}
    </div>
  );
}
