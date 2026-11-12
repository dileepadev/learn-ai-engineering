/**
 * Window events that let separate islands open each other's dialogs.
 *
 * Each Astro island is its own React root, so islands cannot share state or call each
 * other's functions. A DOM event is the simplest bridge that needs no shared store.
 * Example: the search palette's "Keyboard shortcuts" action opens the help dialog that
 * lives in the footer island.
 */

export const OPEN_SEARCH = "lai:open-search";
export const OPEN_SHORTCUTS = "lai:open-shortcuts";

export function emit(name: typeof OPEN_SEARCH | typeof OPEN_SHORTCUTS): void {
  window.dispatchEvent(new CustomEvent(name));
}
