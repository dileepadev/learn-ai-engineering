import { describe, expect, it } from "vitest";
import { normalise, search, type SearchEntry } from "./search.ts";

const INDEX: SearchEntry[] = [
  { title: "Foundations", href: "/phases/01", kind: "phase", text: "Python and the engineering substrate" },
  { title: "RAG", href: "/phases/04", kind: "phase", text: "Retrieval-augmented generation" },
  { title: "Decorators and context managers", href: "/learn/09", kind: "lesson", context: "Phase 1 · Topic 09" },
  { title: "Generators", href: "/learn/08", kind: "lesson", context: "Phase 1 · Topic 08" },
  { title: "Writing a decorator", href: "/learn/09#writing", kind: "section", context: "Decorators and context managers" },
  { title: "Type hints", href: "/learn/10", kind: "lesson", context: "Phase 1 · Topic 10" },
  { title: "Hints about types in practice", href: "/learn/10#practice", kind: "section", context: "Type hints" },
  { title: "Chunking for RAG", href: "/phases/04#chunking", kind: "section", context: "RAG" },
];

const titles = (query: string): string[] => search(INDEX, query).map((hit) => hit.entry.title);

describe("normalise", () => {
  it("folds case, accents, and punctuation", () => {
    expect(normalise("  Regéx — Pätterns!  ")).toBe("regex patterns");
    expect(normalise("async/await")).toBe("async await");
  });
});

describe("search", () => {
  it("returns nothing for an empty or punctuation-only query", () => {
    expect(search(INDEX, "")).toEqual([]);
    expect(search(INDEX, "  ?! ")).toEqual([]);
  });

  it("ranks an exact title above partial matches", () => {
    expect(titles("rag")[0]).toBe("RAG");
  });

  it("matches word prefixes, so a learner can type half a word", () => {
    expect(titles("deco")).toContain("Decorators and context managers");
  });

  it("puts a whole lesson above a section that matches equally well", () => {
    const ranked = titles("decorator");
    expect(ranked.indexOf("Decorators and context managers")).toBeLessThan(
      ranked.indexOf("Writing a decorator"),
    );
  });

  it("requires every word to match, in the title or the entry's context", () => {
    // The section matches too: "context" is in the lesson it belongs to. It ranks second
    // because that word only hit its context, not its title.
    expect(titles("decorator context")).toEqual([
      "Decorators and context managers",
      "Writing a decorator",
    ]);
    expect(titles("decorator generators")).toEqual([]);
  });

  it("rewards the phrase in order", () => {
    expect(titles("type hints")[0]).toBe("Type hints");
  });

  it("can find an entry by hidden text, but ranks it below title matches", () => {
    expect(titles("retrieval")).toEqual(["RAG"]);
    expect(titles("python")).toEqual(["Foundations"]);
  });

  it("does not match across a typo (a stated trade-off, not an accident)", () => {
    expect(titles("decorater")).toEqual([]);
  });

  it("keeps curriculum order between equal scores, and honours the limit", () => {
    const both = search(INDEX, "phase 1", 2).map((hit) => hit.entry.title);
    expect(both).toEqual(["Decorators and context managers", "Generators"]);
  });
});
