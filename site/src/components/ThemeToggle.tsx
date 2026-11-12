import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "lai:theme";

/** Fired on `window` whenever the theme changes, so every toggle on the page stays in sync. */
const THEME_EVENT = "lai:theme";

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Flip the theme and remember the choice.
 *
 * Exported so the search palette's "Toggle theme" action runs the same code as the
 * button. Two copies would drift, for instance one forgetting to persist the choice.
 */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode or blocked storage: the switch still works for this page.
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
  return next;
}

/**
 * Light/dark switch.
 *
 * The inline script in `Base.astro` has already applied the right class before paint;
 * this component only reads it back and lets the learner change it. Rendering `null`
 * until mounted avoids a hydration mismatch, since the server cannot know the choice.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const sync = (): void => setTheme(currentTheme());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {/*
        Both icons are always rendered; CSS shows one. The icon used to depend on the
        `theme` state, which is `null` until mount, so a dark-mode page painted the moon
        first and flipped to the sun about 100ms later, on every page change. The `.dark`
        class is set by the inline script in Base.astro before first paint, so the right
        icon is correct from the first frame and nothing waits for React.
      */}
      <svg viewBox="0 0 24 24" className="size-4.5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-4.5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
