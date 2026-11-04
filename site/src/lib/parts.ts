/**
 * Every trackable *part* of a phase doc: each skill bullet, each project step, each
 * resource.
 *
 * Exit criteria say whether you finished a phase. Parts say how far through it you are.
 * They are found in the markdown itself, so `phases/` stays the single source of truth: add
 * a bullet to a phase doc and it becomes a checkbox on the site at the next build, with no
 * site code to touch.
 *
 * The rules, in the order they matter:
 *
 *  1. **Only top-level list items count.** Every bullet and numbered step under an H2/H3
 *     heading becomes a part. Paragraphs (intros, "Stretch:" lines) do not — stretch goals
 *     are optional by definition.
 *  2. **Sections can opt out.** `<!-- track: off -->` after a heading excludes the rest of
 *     that section. Phase 8's "Alternatives" uses it: those bullets are three options to pick
 *     from, and ticking all three would be a lie.
 *  3. **Keys are hashed from the text, not counted by position.** A part's key is
 *     `<phase>/<section>/<hash of its wording>`. Inserting a bullet above it changes
 *     nothing; rewording it *retires* the old tick instead of quietly attaching it to
 *     whatever moved into its slot. That is the same trade `exerciseKey` makes for drills:
 *     losing a tick you can re-tick in a second is far better than a tick claiming work you
 *     never did. (Exit criteria predate this and are keyed by position — see
 *     `criterionKey` — which is why the docs only ever *append* criteria.)
 *
 * This runs at build time, inside the content loader, after the exit criteria have been
 * hoisted out — so the only task items left in the prose are the ones made here.
 */

export interface Part {
  /** Stable progress key: `<phase>/<section>/<hash>`, plus `-2`, `-3`… for repeats. */
  key: string;
  /** Slug of the enclosing heading(s), e.g. `core-skills.embeddings`. Groups a section. */
  section: string;
  /** The enclosing heading's text, for the section control's label. */
  sectionTitle: string;
  /** The item as plain text — the checkbox's accessible name. */
  text: string;
}

/** A top-level list item that is not already a task item: `- foo`, `1. foo`. */
const LIST_ITEM = /^([-*+]|\d+[.)])(\s+)(?!\[[ xX]\]\s)(\S.*)$/;
const HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*(```|~~~)/;
/** `<!-- track: off -->`, optionally followed by a reason: `<!-- track: off — options -->`. */
const TRACK_OFF = /^\s*<!--\s*track:\s*off\b.*-->\s*$/i;

/**
 * Lowercase, ASCII-only, hyphen-joined. Used for readable key segments only — it does not
 * need to (and does not) match the heading ids Astro generates.
 */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/**
 * Inline markdown to the text a reader sees: link targets, emphasis and code markers, and
 * inline HTML removed.
 *
 * This is also what the key is hashed from, which is deliberate: fixing a broken URL or
 * bolding a phrase is not rewording the task, and must not retire the learner's tick.
 * Underscores are kept, because `search_docs` is a word here, not emphasis.
 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*|\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 32-bit FNV-1a, base 36.
 *
 * Short, deterministic, and dependency-free. Collisions only matter between two parts of
 * the *same section* (the section is part of the key), and identical wording there is
 * handled by the occurrence suffix in `extractParts`.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Find the parts in a phase doc and turn each into a GFM task item.
 *
 * @param markdown - The doc body, with the title, meta lines, and exit criteria already
 *   removed (the loader does that first).
 * @param phaseSlug - The phase id, e.g. `04-rag`; the first segment of every key.
 * @returns The markdown with `[ ] ` inserted into every tracked item, and the parts in
 *   document order — the same order their checkboxes will appear in the rendered HTML.
 */
export function extractParts(
  markdown: string,
  phaseSlug: string,
): { markdown: string; parts: Part[] } {
  const parts: Part[] = [];
  const occurrences = new Map<string, number>();

  let inFence = false;
  let h2 = "";
  let h3 = "";
  let sectionTitle = "";
  let tracked = true;

  const lines = markdown.split("\n").map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const heading = HEADING.exec(line);
    if (heading) {
      const title = plainText(heading[2]!);
      if (heading[1]!.length === 2) {
        h2 = slugify(title);
        h3 = "";
      } else {
        h3 = slugify(title);
      }
      sectionTitle = title;
      // A new heading starts a new section, so an opt-out never leaks past its own.
      tracked = true;
      return line;
    }

    if (TRACK_OFF.test(line)) {
      tracked = false;
      return line;
    }

    const item = LIST_ITEM.exec(line);
    if (!item || !tracked) return line;

    const [, marker, gap, content] = item;
    const text = plainText(content!);
    const section = h3 ? `${h2}.${h3}` : h2 || "intro";
    const base = `${phaseSlug}/${section}/${hashText(text.toLowerCase())}`;
    const seen = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, seen);

    parts.push({
      key: seen === 1 ? base : `${base}-${seen}`,
      section,
      sectionTitle: sectionTitle || "Introduction",
      text,
    });
    return `${marker}${gap}[ ] ${content}`;
  });

  return { markdown: lines.join("\n"), parts };
}

/** What remark-gfm emits for `- [ ] item`, verified against Astro's own pipeline. */
const RENDERED_CHECKBOX = /<input type="checkbox" disabled>/g;

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Stamp each rendered checkbox with the part it belongs to.
 *
 * The checkboxes come out of the markdown renderer in document order, which is exactly the
 * order `extractParts` recorded the parts in. Pairing them by position is therefore safe —
 * *provided the counts agree*, so a mismatch throws and fails the build rather than
 * shipping a page whose boxes tick the wrong parts. They are left `disabled`: they only come
 * alive when `PartsTracker` hydrates, so a page without JavaScript never pretends to save.
 *
 * @param html - The rendered phase doc.
 * @param parts - The parts `extractParts` returned for the same doc.
 * @returns The HTML with `data-part`, `data-section`, and `aria-label` on every checkbox.
 */
export function annotateCheckboxes(html: string, parts: Part[]): string {
  let index = 0;
  const annotated = html.replace(RENDERED_CHECKBOX, (match) => {
    const part = parts[index];
    index += 1;
    if (!part) return match;
    return (
      `<input type="checkbox" disabled data-part="${escapeAttribute(part.key)}"` +
      ` data-section="${escapeAttribute(part.section)}"` +
      ` aria-label="${escapeAttribute(part.text)}">`
    );
  });

  if (index !== parts.length) {
    throw new Error(
      `Part tracking mismatch: ${parts.length} part(s) found in the markdown but ${index} ` +
        "checkbox(es) rendered. A list item the parser counted did not render as a task item " +
        "(or the reverse) — check the doc for unusual list syntax.",
    );
  }
  return annotated;
}
