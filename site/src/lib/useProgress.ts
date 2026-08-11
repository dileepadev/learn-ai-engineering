import { useSyncExternalStore } from "react";
import { getState, subscribe, type ProgressState } from "./progress.ts";
import { emptyState } from "./progress.ts";

/**
 * The progress state, kept in sync across every island on the page.
 *
 * `useSyncExternalStore` rather than a state library: the store is a plain module, the
 * data is small, and this is the one API React provides that handles the server snapshot
 * correctly. Getting that wrong is what produces hydration mismatches — the server has no
 * localStorage, so it must render the empty state, and the client corrects it on mount.
 */
const SERVER_SNAPSHOT = emptyState();

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_SNAPSHOT);
}

/**
 * Whether the store has hydrated from localStorage yet.
 *
 * Components use this to avoid flashing "0% complete" on first paint for a learner who is
 * actually 60% through. Render a skeleton until it is true.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
