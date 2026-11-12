import { useEffect, useRef, useState } from "react";
import { href, isSamePath } from "../lib/href.ts";
import { useHydrated, useProgress } from "../lib/useProgress.ts";
import { usePhaseCounts } from "../lib/phaseCounts.ts";
import { overallProgress } from "../lib/curriculum.ts";
import { CourseNav, type NavPhase } from "./CourseNav.tsx";

interface MobileNavProps {
  phases: NavPhase[];
  currentPath: string;
}

const LINKS = [
  { label: "Dashboard", route: "/" },
  { label: "The role", route: "/role" },
  { label: "About", route: "/about" },
];

/** The width at which the desktop sidebar takes over (Tailwind's `lg`). */
const DESKTOP = "(min-width: 1024px)";

/**
 * The menu button and slide-out drawer for screens without the sidebar.
 *
 * Before this, narrow screens *removed* header links to fit one row, so a phone had no route
 * to the Role page or the progress gauge. Now nothing is dropped: it moves in here.
 *
 * Built on a native `<dialog>` opened with `showModal()`. That provides, with no code
 * here: focus moves into the drawer and is trapped there, Esc closes it, the rest of the
 * page becomes inert to clicks and screen readers, and focus returns to the menu button
 * on close. Hand-rolling those is where most custom drawers fail accessibility.
 */
export function MobileNav({ phases, currentPath }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const state = useProgress();
  const hydrated = useHydrated();
  const overall = overallProgress(state, usePhaseCounts());

  const close = (): void => dialogRef.current?.close();

  // If the window is widened past `lg` while the drawer is open, the sidebar appears and
  // the drawer would be a second copy of it. Close it.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP);
    const onChange = (): void => {
      if (query.matches) close();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        // A click on the backdrop lands on the <dialog> element itself; a click on
        // anything inside lands on a child. Closing on the former is "click outside".
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
          // Following a link closes the drawer too. Needed for same-page links such as
          // "/#roadmap" on the dashboard, where no new page load would close it.
          else if ((event.target as Element).closest("a")) close();
        }}
        className="drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(20rem,88vw)] max-w-none border-r border-line bg-surface p-0 text-ink shadow-(--shadow)"
      >
        {/* Contents mount only while open, so the page never holds a second CourseNav. */}
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-semibold tracking-tight">Learn AI Engineering</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 thin-scrollbar" data-scroll-container>
              {/* The one progress entry in the menu. It replaces the old "Manage progress" row,
                  which only said what you could do there and not what you would see. */}
              {hydrated ? (
                <a
                  href={href("/progress")}
                  aria-current={isSamePath(currentPath, href("/progress")) ? "page" : undefined}
                  className="mb-4 block rounded-lg border border-line bg-raised p-3 transition-colors hover:border-line-strong"
                >
                  <span className="flex items-center justify-between text-sm">
                    <span className="font-medium">Your progress</span>
                    <span className="font-semibold tabular-nums text-accent">{overall.percent}%</span>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${overall.percent}%` }} />
                  </span>
                  <span className="mt-2 block text-xs text-muted">
                    {overall.done} of {overall.total} done · See every phase →
                  </span>
                </a>
              ) : null}

              <ul className="mb-5 space-y-0.5 text-sm">
                {LINKS.map((link) => {
                  const linkHref = href(link.route);
                  const current = isSamePath(currentPath, linkHref);
                  return (
                    <li key={link.route}>
                      <a
                        href={linkHref}
                        aria-current={current ? "page" : undefined}
                        className={`block rounded-md px-2 py-2 transition-colors ${
                          current ? "bg-accent-soft font-medium text-ink" : "text-muted hover:bg-sunken hover:text-ink"
                        }`}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <CourseNav phases={phases} currentPath={currentPath} idPrefix="drawer" />
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
