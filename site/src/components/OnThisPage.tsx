import { useCallback, useEffect, useRef, useState } from "react";

export interface TocItem {
  depth: number;
  slug: string;
  text: string;
}

/**
 * How far below the top of the viewport a heading must pass to count as "being read".
 * The sticky header is 4rem (64px); the extra margin means a heading becomes active once
 * its first line has settled under the header, not the instant it touches it.
 */
const READING_LINE_PX = 112;

/** The heading the reader is in: the last one whose top has passed the reading line. */
function findActive(items: readonly TocItem[]): string | undefined {
  // At the very bottom, short final sections can never reach the reading line, so they
  // would never light up. Treat "scrolled to the end" as "reading the last section".
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) return items.at(-1)?.slug;

  let active: string | undefined;
  for (const item of items) {
    // Looked up every time rather than cached: island sections (drills, exit criteria)
    // re-render on hydration and replace the nodes a cache would be holding.
    const element = document.getElementById(item.slug);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= READING_LINE_PX) active = item.slug;
    else break;
  }
  return active;
}

/**
 * Calls `onFrame` at most once per animation frame while the page scrolls or resizes.
 * Scroll events can fire far faster than the screen redraws; doing layout reads on each
 * one is wasted work.
 */
function useScrollFrame(onFrame: () => void): void {
  useEffect(() => {
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        onFrame();
      });
    };
    onFrame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [onFrame]);
}

/**
 * The "On this page" list beside a long page, with the section being read highlighted.
 *
 * The links are plain anchors and work before hydration. Hydration only adds the
 * highlight. Uses a per-frame position check rather than an IntersectionObserver: an
 * observer only reports headings as they cross its margin, so a jump of several sections
 * (a contents click, the End key) can leave the wrong one lit, while checking ~30 headings
 * per frame is cheap and always right.
 */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(undefined);
  // Memoised so the scroll listeners are not torn down and re-added on every render.
  const update = useCallback(() => setActive(findActive(items)), [items]);
  useScrollFrame(update);

  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="on-this-page-label" className="text-sm">
      <p id="on-this-page-label" className="pb-3 text-xs font-semibold uppercase tracking-wider text-faint">
        On this page
      </p>
      <ol className="space-y-0.5 border-l border-line">
        {items.map((item) => {
          const current = item.slug === active;
          return (
            <li key={item.slug}>
              <a
                href={`#${item.slug}`}
                aria-current={current ? "location" : undefined}
                className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                  item.depth > 2 ? "pl-6 text-xs" : "pl-3"
                } ${
                  current
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
      <a href="#main" className="mt-4 inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-ink">
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to top
      </a>
    </nav>
  );
}

/**
 * A thin bar under the header showing how far down the page you are.
 *
 * Written straight to the element's style each frame instead of through React state: it
 * changes on every scroll frame, and a re-render per frame for one number is waste.
 * `transform: scaleX` is used rather than `width` because transforms skip layout.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const update = useCallback(() => {
    if (!bar.current) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
    bar.current.style.transform = `scaleX(${fraction})`;
  }, []);
  useScrollFrame(update);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-0.5 origin-left scale-x-0 bg-accent"
    />
  );
}
