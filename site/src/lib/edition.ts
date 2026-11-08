/**
 * Which edition of the roadmap this build is.
 *
 * The curriculum is refreshed once a year: AI engineering moves too fast for a roadmap to
 * stay right for longer. Each edition is a release with its own deadline — the 2027 edition
 * is meant to be finished by the end of 2027, and the 2028 edition replaces it.
 *
 * Everything year-specific on the site reads from here, so cutting the next edition is a
 * change to this file plus the content in `phases/` — see "Cutting a new edition" in
 * AGENTS.md. Progress records the edition it was made against (`ProgressState.edition`), so
 * a later edition can tell an old save apart and offer to archive it instead of mixing
 * last year's ticks into this year's curriculum.
 */

export const EDITION = "2027";

/** The last day of the edition, inclusive, as a local calendar date. */
export const EDITION_DEADLINE = "2027-12-31";

/** The release that follows this one. */
export const NEXT_EDITION = "2028";
