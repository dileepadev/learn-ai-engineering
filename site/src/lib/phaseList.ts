/**
 * The eight phases as every page sees them, loaded once per build.
 *
 * Server-only: it imports `astro:content`, so only `.astro` files and endpoints may import
 * it. React islands get the data as props, or through `phaseCounts.ts` for the counts.
 */

import { getCollection } from "astro:content";
import type { PhaseMeta } from "../components/Dashboard.tsx";
import type { PhaseCounts } from "./curriculum.ts";

/** Every phase in curriculum order, with what an island needs to show it. */
export async function loadPhases(): Promise<PhaseMeta[]> {
  const entries = await getCollection("phases");
  return entries
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((entry) => ({
      slug: entry.id,
      number: entry.data.number,
      title: entry.data.title,
      goal: entry.data.goal,
      youBuild: entry.data.youBuild,
      effort: entry.data.effort,
      counts: {
        criteria: entry.data.exitCriteria.length,
        // Part *keys*, not a count: a retired key left in storage must not count (see curriculum.ts).
        parts: entry.data.parts.map((part) => part.key),
      },
    }));
}

/** `{ slug: counts }`, the shape `overallProgress` and `nextUp` take. */
export function countsBySlug(phases: readonly PhaseMeta[]): Record<string, PhaseCounts> {
  return Object.fromEntries(phases.map((phase) => [phase.slug, phase.counts]));
}
