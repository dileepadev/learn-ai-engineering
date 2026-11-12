import type { Status } from "../lib/curriculum.ts";

const LABEL: Record<Status, string> = {
  complete: "complete",
  "in-progress": "in progress",
  upcoming: "not started",
};

/**
 * A small status marker: a tick, a half-filled ring, or an empty ring.
 *
 * The shape changes as well as the colour, so the three states stay distinguishable for
 * someone who cannot tell the green from the amber. The status is also given in
 * screen-reader text, because an SVG on its own says nothing.
 *
 * `status` is `null` before hydration, when progress is not known yet: it renders a
 * neutral ring rather than claiming "not started" for someone who is halfway through.
 */
export function StatusIcon({ status, className = "size-4" }: { status: Status | null; className?: string }) {
  if (status === "complete") {
    return (
      <span className={`inline-grid shrink-0 place-items-center rounded-full bg-done text-white ${className}`}>
        <svg viewBox="0 0 24 24" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">, {LABEL.complete}</span>
      </span>
    );
  }

  return (
    <span className={`inline-block shrink-0 ${className}`}>
      <svg viewBox="0 0 16 16" className="size-full" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" strokeWidth="1.5" stroke={status === "in-progress" ? "var(--color-doing)" : "var(--border-strong)"} />
        {status === "in-progress" ? <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="var(--color-doing)" /> : null}
      </svg>
      {status ? <span className="sr-only">, {LABEL[status]}</span> : null}
    </span>
  );
}
