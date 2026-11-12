/**
 * The rules every global keyboard shortcut on the site goes through.
 *
 * A single-key shortcut is only safe if it never fires while the learner is typing. The
 * dangerous case on this site is the drill editor. It is a CodeMirror `contenteditable`,
 * not an `<input>`, so a naive `←` handler would turn "move the cursor left" into "leave
 * the page and lose my edit". Everything here exists to rule that out, in one place, so no
 * component has to remember the list.
 */

/** Elements whose keystrokes belong to the element, never to a page-level shortcut. */
const EDITABLE_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable]:not([contenteditable="false"])',
  // CodeMirror marks its content `contenteditable`, but focus can sit on the wrapper too.
  ".cm-editor",
].join(", ");

/**
 * Whether keystrokes on this target are text entry.
 *
 * Uses `closest()` rather than `isContentEditable`, which jsdom does not implement, so the
 * same code path is exercised by the unit tests and the browser.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(EDITABLE_SELECTOR) !== null;
}

/** Whether a modal (search, shortcuts help, the mobile menu) currently owns the keyboard. */
export function isDialogOpen(doc: Document = document): boolean {
  return doc.querySelector("dialog[open]") !== null;
}

/**
 * Whether the focused element scrolls sideways.
 *
 * Wide comparison tables and long code blocks scroll horizontally, and once focused the
 * arrow keys are how a keyboard user scrolls them. Stealing `←`/`→` there would make the
 * content unreadable without a mouse.
 */
export function isHorizontallyScrollable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.scrollWidth > element.clientWidth;
}

/**
 * Whether a plain, single-key shortcut (`/`, `?`, `←`, `→`) should run for this event.
 *
 * Shift is allowed, because `?` is Shift+/ on most layouts. Ctrl, Alt and Meta are not:
 * those combinations belong to the browser and the operating system.
 */
export function shouldHandlePlainShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (isTypingTarget(event.target)) return false;
  return !isDialogOpen();
}

/** Whether `←`/`→` should move between pages for this event. */
export function shouldHandleArrowNavigation(event: KeyboardEvent): boolean {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return false;
  if (event.shiftKey) return false;
  if (!shouldHandlePlainShortcut(event)) return false;
  return !isHorizontallyScrollable(document.activeElement);
}

/**
 * Ctrl+K (Windows/Linux) or ⌘K (macOS) opens search.
 *
 * Unlike the plain shortcuts this one *does* fire from inside a text field, because the
 * modifier makes it unambiguous and it is the shortcut people press to get *out* of
 * whatever they are doing. It still yields to an editor: inside the drill editor
 * Ctrl/⌘+K is a CodeMirror binding, so it is left alone there.
 */
export function isSearchShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.shiftKey) return false;
  if (!(event.ctrlKey || event.metaKey)) return false;
  if (event.key.toLowerCase() !== "k") return false;
  return !(event.target instanceof Element && event.target.closest(".cm-editor"));
}

/** Whether to label shortcuts with ⌘ rather than Ctrl. Only meaningful in the browser. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  // `userAgentData` is the modern source; `platform` is the deprecated but universal one.
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return /mac|iphone|ipad|ipod/i.test(data?.platform ?? navigator.platform ?? "");
}
