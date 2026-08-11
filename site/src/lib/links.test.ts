import { describe, expect, it } from "vitest";
import { rewriteLinks, routeForRepoPath, splitTitle, withBase } from "./links.ts";

const BASE = "/learn-ai-engineering";

describe("routeForRepoPath", () => {
  it("maps phase docs to phase routes", () => {
    expect(routeForRepoPath("phases/04-rag.md")).toBe("/phases/04-rag");
  });

  it("maps Part A lessons to learn routes", () => {
    expect(routeForRepoPath("phases/01-foundations/part-a/lessons/05-files-and-json.md")).toBe(
      "/learn/05-files-and-json",
    );
  });

  it("folds the Part A index into the Phase 1 page", () => {
    expect(routeForRepoPath("phases/01-foundations/part-a/README.md")).toBe("/phases/01-foundations");
  });

  it("has no route for source files", () => {
    expect(routeForRepoPath("phases/01-foundations/part-a/drills/d01_core_mechanics.py")).toBeNull();
  });
});

describe("rewriteLinks", () => {
  const lessonDir = "phases/01-foundations/part-a/lessons";

  it("rewrites a sibling lesson link to a site route", () => {
    const out = rewriteLinks("See [topic 00](00-python-basics.md).", {
      sourceDir: lessonDir,
      base: BASE,
    });
    expect(out).toBe("See [topic 00](/learn-ai-engineering/learn/00-python-basics).");
  });

  it("resolves `..` segments before mapping", () => {
    // The real occurrence of this link is in part-a/README.md, one level above lessons/.
    const out = rewriteLinks("[the phase doc](../../01-foundations.md)", {
      sourceDir: "phases/01-foundations/part-a",
      base: BASE,
    });
    expect(out).toBe("[the phase doc](/learn-ai-engineering/phases/01-foundations)");
  });

  it("sends files with no page to GitHub", () => {
    const out = rewriteLinks("[the drill](../drills/d01_core_mechanics.py)", {
      sourceDir: lessonDir,
      base: BASE,
    });
    expect(out).toContain("https://github.com/dileepadev/learn-ai-engineering/blob/main/");
    expect(out).toContain("part-a/drills/d01_core_mechanics.py");
  });

  it("preserves fragments", () => {
    const out = rewriteLinks("[criteria](../../01-foundations.md#exit-criteria)", {
      sourceDir: "phases/01-foundations/part-a",
      base: BASE,
    });
    expect(out).toBe("[criteria](/learn-ai-engineering/phases/01-foundations#exit-criteria)");
  });

  it("leaves external links, anchors, and images alone", () => {
    const input = "[docs](https://docs.python.org/3/) and [top](#top)";
    expect(rewriteLinks(input, { sourceDir: lessonDir, base: BASE })).toBe(input);
  });

  it("rewrites reference-style definitions", () => {
    const out = rewriteLinks("[ref]: 00-python-basics.md", { sourceDir: lessonDir, base: BASE });
    expect(out).toBe("[ref]: /learn-ai-engineering/learn/00-python-basics");
  });

  it("does not mangle a link title", () => {
    const out = rewriteLinks('[x](00-python-basics.md "Topic 00")', {
      sourceDir: lessonDir,
      base: BASE,
    });
    expect(out).toBe('[x](/learn-ai-engineering/learn/00-python-basics "Topic 00")');
  });
});

describe("splitTitle", () => {
  it("strips the H1 and the numeric prefix", () => {
    const { title, body } = splitTitle("# 01 — Core mechanics\n\nThe four containers.");
    expect(title).toBe("Core mechanics");
    expect(body).toBe("The four containers.");
  });

  it("handles the phase-doc heading shape", () => {
    expect(splitTitle("# Phase 2 — LLMs & Model APIs\n\nBody").title).toBe("LLMs & Model APIs");
  });

  it("returns the whole document when there is no H1", () => {
    const { title, body } = splitTitle("No heading here.");
    expect(title).toBe("");
    expect(body).toBe("No heading here.");
  });
});

describe("withBase", () => {
  it("joins without doubling slashes", () => {
    expect(withBase("/learn-ai-engineering/", "/phases/04-rag")).toBe(
      "/learn-ai-engineering/phases/04-rag",
    );
  });

  it("handles a root base", () => {
    expect(withBase("/", "/")).toBe("/");
  });
});
