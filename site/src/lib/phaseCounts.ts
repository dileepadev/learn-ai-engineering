/**
 * Phase counts, shipped once per page instead of once per island.
 *
 * The counts carry every part key (roughly 15KB). Astro serialises island props into the
 * HTML separately for each island, so the header gauge, the sidebar, the mobile menu, and
 * the search palette would each have embedded their own copy. Instead `Base.astro` writes
 * them once into a `<script type="application/json">`, and islands read that.
 *
 * This works because nothing renders counts on the server: progress lives in
 * localStorage, so every progress readout already waits for hydration (`useHydrated`).
 * The server snapshot below is empty for the same reason `useProgress`'s is.
 */

import { useSyncExternalStore } from "react";
import type { PhaseCounts } from "./curriculum.ts";

export const PHASE_COUNTS_ID = "lai-phase-counts";

type CountsBySlug = Record<string, PhaseCounts>;

const EMPTY: CountsBySlug = {};
let cached: CountsBySlug | null = null;

/**
 * Serialise counts for embedding in a `<script>` element.
 *
 * Escaping `<` is what makes this safe to inline: without it, a string containing
 * `</script>` would end the element early. Part keys are slugs and cannot contain one
 * today, but this should not depend on that.
 */
export function serialiseCounts(counts: CountsBySlug): string {
  return JSON.stringify(counts).replace(/</g, "\\u003c");
}

function readCounts(): CountsBySlug {
  if (cached) return cached;
  const raw = document.getElementById(PHASE_COUNTS_ID)?.textContent;
  try {
    cached = raw ? (JSON.parse(raw) as CountsBySlug) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

/** The data never changes after load, so there is nothing to subscribe to. */
const subscribe = (): (() => void) => () => {};

/** Every phase's counts, keyed by slug. Empty during SSR and hydration. */
export function usePhaseCounts(): CountsBySlug {
  return useSyncExternalStore(subscribe, readCounts, () => EMPTY);
}
