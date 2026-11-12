import { describe, expect, it } from "vitest";
import { isSamePath } from "./href.ts";

describe("isSamePath", () => {
  it("ignores a trailing slash, since trailingSlash: ignore serves both", () => {
    expect(isSamePath("/learn-ai-engineering/learn/03", "/learn-ai-engineering/learn/03/")).toBe(true);
    expect(isSamePath("/x//", "/x")).toBe(true);
  });

  it("keeps the root distinct from everything else", () => {
    expect(isSamePath("/", "/")).toBe(true);
    expect(isSamePath("/", "/learn")).toBe(false);
  });

  it("does not treat a prefix as the same page", () => {
    // Otherwise every lesson would mark Phase 1 as current, and /phases/0 would match /phases/01.
    expect(isSamePath("/phases/01-foundations", "/phases/01-foundations-extra")).toBe(false);
  });
});
