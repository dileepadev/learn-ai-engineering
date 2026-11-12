import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { href } from "../lib/href.ts";
import { emit, OPEN_SEARCH, OPEN_SHORTCUTS } from "../lib/events.ts";
import { isApplePlatform, isSearchShortcut, shouldHandlePlainShortcut } from "../lib/keys.ts";
import { search, type SearchEntry, type SearchKind } from "../lib/search.ts";
import { nextUp } from "../lib/curriculum.ts";
import { useProgress } from "../lib/useProgress.ts";
import { usePhaseCounts } from "../lib/phaseCounts.ts";
import { toggleTheme } from "./ThemeToggle.tsx";

/** One row in the palette: a place to go, or an action to run. */
interface Item {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  /** Full path, base included. */
  href?: string;
  run?: () => void;
}

const KIND_LABEL: Record<SearchKind, string> = {
  page: "Page",
  phase: "Phase",
  lesson: "Lesson",
  section: "Section",
};

type IndexState = { status: "idle" | "loading" | "error" } | { status: "ready"; entries: SearchEntry[] };

/**
 * Ctrl/⌘K search over every phase, lesson, and section heading, plus a few quick actions.
 *
 * Design choices, and why:
 *
 * - **The index loads on first open**, from `/search-index.json`, which is built at build
 *   time. Inlining it would add it to every page's HTML for a feature most visits never use.
 * - **A native `<dialog>`** handles focus trapping, Esc, and the inert background (same
 *   reasoning as `MobileNav`).
 * - **The ARIA combobox pattern**: focus stays in the text box, and the highlighted result
 *   is announced through `aria-activedescendant`. Moving real focus onto results would make
 *   the learner tab back to the input to keep typing.
 * - **With an empty query it is a launcher, not a blank box**: "Continue where you left off"
 *   comes first, the same answer as the dashboard's big button, reachable from any page.
 */
export function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<IndexState>({ status: "idle" });
  const [apple, setApple] = useState(false);
  const state = useProgress();
  const counts = usePhaseCounts();
  const baseId = useId();

  useEffect(() => setApple(isApplePlatform()), []);

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    setActive(0);
    dialog.showModal();
    setOpen(true);
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Global entry points: Ctrl/⌘K from anywhere, `/` when not typing, and the event
  // other islands send.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (isSearchShortcut(event)) {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else show();
      } else if (event.key === "/" && shouldHandlePlainShortcut(event)) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH, show);
    };
  }, [show, close]);

  // Fetch the index the first time the palette opens; keep it for the rest of the visit.
  useEffect(() => {
    if (!open || index.status !== "idle") return;
    setIndex({ status: "loading" });
    fetch(href("/search-index.json"))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SearchEntry[]>;
      })
      .then((entries) => setIndex({ status: "ready", entries }))
      .catch(() => setIndex({ status: "error" }));
  }, [open, index.status]);

  const items: Item[] = useMemo(() => {
    if (query.trim() === "") {
      const next = nextUp(state, Object.keys(counts).sort(), counts);
      const actions: Item[] = [
        { id: "dashboard", title: "Dashboard", subtitle: "Where you are and what is next", badge: "Page", href: href("/") },
        { id: "theme", title: "Toggle light / dark theme", badge: "Action", run: toggleTheme },
        { id: "shortcuts", title: "Keyboard shortcuts", badge: "Action", run: () => emit(OPEN_SHORTCUTS) },
        { id: "progress", title: "Your progress", subtitle: "Every phase at a glance. Export, import, or reset", badge: "Page", href: href("/progress") },
      ];
      return next
        ? [{ id: "continue", title: next.label, subtitle: next.detail, badge: "Continue", href: href(next.href) }, ...actions]
        : actions;
    }
    if (index.status !== "ready") return [];
    return search(index.entries, query).map(({ entry }, i) => ({
      id: `hit-${i}`,
      title: entry.title,
      subtitle: entry.context,
      badge: KIND_LABEL[entry.kind],
      href: entry.href,
    }));
  }, [query, index, state, counts]);

  const optionId = useCallback((i: number): string => `${baseId}-option-${i}`, [baseId]);
  const listId = `${baseId}-results`;

  // Keep the highlighted row visible as the arrow keys move it through a long list.
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open, optionId]);

  const activate = (item: Item | undefined): void => {
    if (!item) return;
    close();
    if (item.run) item.run();
    else if (item.href) window.location.assign(item.href);
  };

  const onInputKey = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(items[active]);
    }
  };

  const empty =
    query.trim() !== "" &&
    (index.status === "loading"
      ? "Loading the index…"
      : index.status === "error"
        ? "Search is unavailable: the index failed to load. Try reloading the page."
        : items.length === 0
          ? `Nothing matches “${query.trim()}”.`
          : null);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K /"
        className="flex h-9 shrink-0 items-center gap-2 rounded-md px-2 text-muted transition-colors hover:bg-sunken hover:text-ink lg:border lg:border-line lg:pl-2.5 lg:pr-1.5 lg:hover:border-line-strong"
      >
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <span className="hidden text-sm lg:inline">Search</span>
        {/* Fixed-width slot: "⌘K" is narrower than "Ctrl K" and only known after hydration,
            so a bare <kbd> here would resize the button (and shift the header) on macOS. */}
        <span className="ml-3 hidden w-13 justify-items-center lg:grid">
          <kbd className="kbd">{apple ? "⌘K" : "Ctrl K"}</kbd>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search the roadmap"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="palette mx-auto mb-auto mt-[10vh] w-[min(40rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-xl border border-line bg-raised p-0 text-ink shadow-(--shadow)"
      >
        {open ? (
          <div className="flex max-h-[min(32rem,75vh)] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                role="combobox"
                aria-label="Search phases, lessons, and sections"
                aria-expanded={items.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={items.length > 0 ? optionId(active) : undefined}
                placeholder="Search phases, lessons, sections…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                spellCheck={false}
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
              />
              <kbd className="kbd">Esc</kbd>
            </div>

            {query.trim() === "" ? (
              <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-faint">Quick actions</p>
            ) : null}

            <ul id={listId} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2 thin-scrollbar">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => activate(item)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${
                    i === active ? "bg-accent-soft" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.subtitle ? <span className="block truncate text-xs text-muted">{item.subtitle}</span> : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      item.badge === "Continue" ? "border-accent/40 text-accent" : "border-line text-faint"
                    }`}
                  >
                    {item.badge}
                  </span>
                </li>
              ))}
            </ul>

            {empty ? <p className="px-4 pb-6 pt-2 text-center text-sm text-muted">{empty}</p> : null}

            <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-xs text-faint sm:flex">
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> to move
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↵</kbd> to open
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <kbd className="kbd">Esc</kbd> to close
              </span>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
