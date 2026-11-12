import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_SHORTCUTS } from "../lib/events.ts";
import { isApplePlatform, shouldHandlePlainShortcut } from "../lib/keys.ts";

/**
 * The `?` dialog listing every shortcut, plus the footer link that opens it.
 *
 * Shortcuts nobody knows about don't help anyone. They are listed here, hinted on the
 * search button and the lesson pager, and this dialog is reachable by mouse from the footer
 * and from the search palette, not only by a key you would have to know already.
 */
export function ShortcutsHelp() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [apple, setApple] = useState(false);

  useEffect(() => setApple(isApplePlatform()), []);

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "?" && shouldHandlePlainShortcut(event)) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS, show);
    };
  }, [show]);

  const mod = apple ? "⌘" : "Ctrl";
  const rows: { keys: string[]; action: string }[] = [
    { keys: [`${mod} K`, "/"], action: "Search phases, lessons, and sections" },
    { keys: ["←", "→"], action: "Previous or next lesson or phase" },
    { keys: ["?"], action: "Show this list" },
    { keys: ["Esc"], action: "Close search, this list, or the menu" },
  ];

  return (
    <>
      <button type="button" onClick={show} className="transition-colors hover:text-ink">
        Keyboard shortcuts
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="shortcuts-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="palette m-auto w-[min(28rem,calc(100vw-2rem))] max-w-none rounded-xl border border-line bg-raised p-0 text-ink shadow-(--shadow)"
      >
        {open ? (
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-lg font-semibold tracking-tight">
                Keyboard shortcuts
              </h2>
              <button
                type="button"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <dl className="mt-4 divide-y divide-line text-sm">
              {rows.map((row) => (
                <div key={row.action} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-muted">{row.action}</dt>
                  <dd className="flex shrink-0 items-center gap-1.5">
                    {row.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1.5">
                        {i > 0 ? <span className="text-xs text-faint">or</span> : null}
                        <kbd className="kbd">{key}</kbd>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-faint">
              Single-key shortcuts are off while you type, including in the drill editor, so they never
              take over a keystroke meant for your code.
            </p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
