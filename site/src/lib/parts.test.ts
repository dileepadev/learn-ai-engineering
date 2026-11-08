// @vitest-environment node
// These tests read the real phase docs from disk and need no DOM; under the suite's default
// jsdom environment `import.meta.url` is not a file URL.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// Astro's own markdown pipeline (it ships with `astro`), so these tests render task items
// exactly the way a real build does rather than against a guess at its output.
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { annotateCheckboxes, extractParts, hashText, plainText, slugify } from "./parts.ts";

const PHASES_DIR = fileURLToPath(new URL("../../../phases", import.meta.url));

describe("slugify and plainText", () => {
  it("slugs headings into readable key segments", () => {
    expect(slugify("Vector storage & retrieval")).toBe("vector-storage-retrieval");
    expect(slugify("Part A — Python, from the start")).toBe("part-a-python-from-the-start");
    expect(slugify("!!!")).toBe("section");
  });

  it("strips link targets, emphasis, and code markers but keeps snake_case", () => {
    expect(plainText("**Primary: [pgvector](https://x.y).** Use `search_docs` *now*.")).toBe(
      "Primary: pgvector. Use search_docs now.",
    );
  });
});

describe("extractParts", () => {
  const doc = [
    "## Core skills",
    "",
    "### Embeddings",
    "",
    "- What an **embedding** is ([docs](https://x.y)).",
    "- Hosted vs open-source models.",
    "",
    "## Project",
    "",
    "1. Ingest the corpus.",
    "2. Answer with citations.",
    "",
    "**Stretch:** not a list item, so not a part.",
    "",
    "## Alternatives",
    "<!-- track: off -->",
    "",
    "- Option one",
    "- Option two",
    "",
    "## Resources",
    "",
    "```py",
    "- a list marker inside code is code",
    "```",
    "",
    "- [The docs](https://example.com)",
  ].join("\n");

  const { markdown, parts } = extractParts(doc, "04-rag");

  it("tracks top-level bullets and numbered steps, in document order", () => {
    expect(parts.map((part) => part.text)).toEqual([
      "What an embedding is (docs).",
      "Hosted vs open-source models.",
      "Ingest the corpus.",
      "Answer with citations.",
      "The docs",
    ]);
  });

  it("turns tracked items into task items and leaves everything else alone", () => {
    expect(markdown).toContain("- [ ] What an **embedding** is");
    expect(markdown).toContain("1. [ ] Ingest the corpus.");
    expect(markdown).toContain("- Option one");
    expect(markdown).toContain("- a list marker inside code is code");
    expect(markdown).toContain("**Stretch:** not a list item");
  });

  it("honours `<!-- track: off -->` for its own section only", () => {
    expect(parts.some((part) => part.text.startsWith("Option"))).toBe(false);
    expect(parts.at(-1)?.section).toBe("resources");
  });

  it("builds keys from phase, section, and a hash of the wording", () => {
    const first = parts[0]!;
    expect(first.section).toBe("core-skills.embeddings");
    expect(first.sectionTitle).toBe("Embeddings");
    expect(first.key).toBe(
      `04-rag/core-skills.embeddings/${hashText("what an embedding is (docs).")}`,
    );
  });

  it("keeps a key when a bullet is inserted above it or a link is fixed", () => {
    const edited = doc
      .replace("- Hosted vs open-source models.", "- A brand new bullet.\n- Hosted vs open-source models.")
      .replace("https://x.y", "https://fixed.example");
    const keys = new Set(extractParts(edited, "04-rag").parts.map((part) => part.key));
    for (const part of parts) expect(keys.has(part.key)).toBe(true);
  });

  it("retires a key when the wording changes", () => {
    const reworded = doc.replace("Hosted vs open-source models.", "Hosted versus local models.");
    const keys = new Set(extractParts(reworded, "04-rag").parts.map((part) => part.key));
    expect(keys.has(parts[1]!.key)).toBe(false);
  });

  it("accepts a reason after the opt-out marker", () => {
    const { parts: none } = extractParts(
      "## Alternatives\n\n<!-- track: off — options, not tasks -->\n\n- A\n- B\n",
      "08-capstone",
    );
    expect(none).toHaveLength(0);
  });

  it("disambiguates identical items in one section", () => {
    const { parts: twins } = extractParts("## Resources\n\n- Same\n- Same\n", "08-capstone");
    expect(twins).toHaveLength(2);
    expect(twins[1]!.key).toBe(`${twins[0]!.key}-2`);
  });

  it("never double-converts an existing task item", () => {
    const { markdown: out, parts: none } = extractParts("## Done\n\n- [ ] already a task\n", "x");
    expect(none).toHaveLength(0);
    expect(out).toContain("- [ ] already a task");
  });
});

describe("annotateCheckboxes", () => {
  it("stamps every rendered box with its part, in order", async () => {
    const { markdown, parts } = extractParts('## A\n\n- One "quoted" <b>\n- Two\n', "01-x");
    const processor = await createMarkdownProcessor({});
    const { code } = await processor.render(markdown);
    const html = annotateCheckboxes(code, parts);

    expect(html.match(/data-part=/g)).toHaveLength(2);
    expect(html).toContain(`data-part="${parts[0]!.key}"`);
    expect(html).toContain('aria-label="One &quot;quoted&quot;"');
    expect(html).toContain("disabled");
  });

  it("fails loudly when boxes and parts disagree", () => {
    expect(() =>
      annotateCheckboxes('<input type="checkbox" disabled>', []),
    ).toThrow(/mismatch/);
  });
});

describe("the real phase docs", () => {
  const files = readdirSync(PHASES_DIR).filter((name) => /^\d{2}-.+\.md$/.test(name));

  // Pinned to the 2027 edition's six phases, so a broken filename pattern cannot silently
  // drop a doc from the site. Update it when an edition changes the number of phases.
  it("finds all six phase docs", () => {
    expect(files).toHaveLength(6);
  });

  for (const file of files) {
    it(`${file}: every key is unique and every part renders a box`, async () => {
      const slug = file.replace(/\.md$/, "");
      const raw = readFileSync(join(PHASES_DIR, file), "utf-8");
      // The exit-criteria section is hoisted out before parts are extracted; mimic that by
      // cutting the checklist so its `- [ ]` items are not mistaken for parts.
      const body = raw.replace(/^- \[ \] .*$/gm, "");
      const { markdown, parts } = extractParts(body, slug);

      expect(parts.length).toBeGreaterThan(10);
      expect(new Set(parts.map((part) => part.key)).size).toBe(parts.length);

      const processor = await createMarkdownProcessor({});
      const { code } = await processor.render(markdown);
      expect(() => annotateCheckboxes(code, parts)).not.toThrow();
    });
  }
});
