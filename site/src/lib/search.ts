/**
 * Ranking for the Ctrl/⌘K search palette.
 *
 * Hand-rolled instead of pulling in Fuse.js or similar: the index is a few hundred short
 * titles, so a scorer this size is fast enough, has no dependency, and stays readable. That
 * matters in a repo built around "one primary tool per category". The trade-off is no
 * typo tolerance. "decorater" finds nothing. For navigating titles you can see, prefix
 * matching covers nearly every real query, and a fuzzy matcher's false positives are what
 * make palettes feel random.
 */

export type SearchKind = "page" | "phase" | "lesson" | "section";

export interface SearchEntry {
  title: string;
  /** Full path, base included. */
  href: string;
  kind: SearchKind;
  /** Where the entry lives, shown under the title ("Phase 4 · RAG"). Also matched, lightly. */
  context?: string;
  /** Extra text that can match but is never shown, e.g. a phase's goal line. */
  text?: string;
}

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

/**
 * Lower-case, strip accents and punctuation, collapse whitespace.
 *
 * NFKD splits "é" into "e" plus a combining accent, which the `\p{M}` class then drops,
 * so "regex" matches "Regéx" either way round.
 */
export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Points per query word, by where and how well it matched. Order is the ranking policy. */
const WORD_SCORES = {
  titleWord: 10, // "rag" in "RAG pipelines"
  titleWordPrefix: 6, // "deco" in "Decorators"
  titleSubstring: 3, // "erat" in "Generators"
  context: 2,
  text: 1,
} as const;

/** Whole entries outrank sections inside them when the words match equally well. */
const KIND_BONUS: Record<SearchKind, number> = { page: 2, phase: 2, lesson: 2, section: 0 };

function scoreWord(word: string, titleWords: string[], title: string, context: string, text: string): number {
  if (titleWords.includes(word)) return WORD_SCORES.titleWord;
  if (titleWords.some((candidate) => candidate.startsWith(word))) return WORD_SCORES.titleWordPrefix;
  if (title.includes(word)) return WORD_SCORES.titleSubstring;
  if (context.includes(word)) return WORD_SCORES.context;
  if (text.includes(word)) return WORD_SCORES.text;
  return 0;
}

/**
 * Score one entry against an already-normalised query.
 *
 * @returns 0 when any query word is missing. Words are ANDed, so adding a word narrows
 *   the list, the way people expect a search box to behave.
 */
export function scoreEntry(entry: SearchEntry, query: string): number {
  const words = query.split(" ").filter(Boolean);
  if (words.length === 0) return 0;

  const title = normalise(entry.title);
  const titleWords = title.split(" ");
  const context = normalise(entry.context ?? "");
  const text = normalise(entry.text ?? "");

  let score = 0;
  for (const word of words) {
    const points = scoreWord(word, titleWords, title, context, text);
    if (points === 0) return 0;
    score += points;
  }

  // Phrase bonuses, so "type hints" puts "Type hints" above "Hints about types".
  if (title === query) score += 20;
  else if (title.startsWith(query)) score += 8;

  return score + KIND_BONUS[entry.kind];
}

/**
 * Rank `entries` for `rawQuery`, best first.
 *
 * Ties keep index order, which is curriculum order, so equal matches read top to bottom
 * the way the roadmap does.
 *
 * @param entries - The search index.
 * @param rawQuery - What the learner typed.
 * @param limit - Maximum hits to return.
 */
export function search(entries: readonly SearchEntry[], rawQuery: string, limit = 12): SearchHit[] {
  const query = normalise(rawQuery);
  if (query === "") return [];

  return entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, query) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry, score }) => ({ entry, score }));
}
