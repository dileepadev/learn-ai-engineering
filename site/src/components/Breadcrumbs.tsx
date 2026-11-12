import { href } from "../lib/href.ts";

export interface Crumb {
  label: string;
  /** Root-relative route. Omit on the last crumb, which is the current page. */
  route?: string;
}

/**
 * "Dashboard / Phase 1 · Foundations / Topic 03": where this page sits, one click per level.
 *
 * Replaces the single "← back" link the headers had, which only went up one level and
 * never said where you were. Marked up as the WAI-ARIA breadcrumb pattern: a labelled
 * `<nav>`, an ordered list, and `aria-current="page"` on the last item. The separators are
 * CSS, so screen readers do not read out a slash between every item.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <svg viewBox="0 0 24 24" className="size-3 text-faint" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {item.route && !last ? (
                <a href={href(item.route)} className="rounded transition-colors hover:text-ink">
                  {item.label}
                </a>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-ink">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
