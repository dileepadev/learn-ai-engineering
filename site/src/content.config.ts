import { defineCollection } from "astro:content";
// `z` re-exported from `astro:content` is deprecated in Astro 6; the canonical import is
// the bundled zod itself.
import { z } from "astro/zod";
import { file } from "astro/loaders";
import { curriculumLoader } from "./lib/loaders.ts";

const exitCriterion = z.object({
  index: z.number(),
  text: z.string(),
});

/** The eight roadmap docs, `phases/NN-name.md`. */
const phases = defineCollection({
  loader: curriculumLoader({
    dir: "phases",
    match: /^\d{2}-.+\.md$/,
    hoistCriteria: true,
  }),
  schema: z.object({
    title: z.string(),
    number: z.string(),
    goal: z.string().optional(),
    youBuild: z.string().optional(),
    effort: z.string().optional(),
    exitCriteria: z.array(exitCriterion),
    /** The doc's own wording: "Exit criteria" everywhere except the capstone's "Done means". */
    exitCriteriaHeading: z.string().default("Exit criteria"),
    sourcePath: z.string(),
  }),
});

/** The twelve Phase 1 Part A lessons. */
const lessons = defineCollection({
  loader: curriculumLoader({
    dir: "phases/01-foundations/part-a/lessons",
    match: /^\d{2}-.+\.md$/,
    hoistCriteria: false,
  }),
  schema: z.object({
    title: z.string(),
    number: z.string(),
    goal: z.string().optional(),
    youBuild: z.string().optional(),
    effort: z.string().optional(),
    exitCriteria: z.array(exitCriterion),
    /** The doc's own wording: "Exit criteria" everywhere except the capstone's "Done means". */
    exitCriteriaHeading: z.string().default("Exit criteria"),
    sourcePath: z.string(),
  }),
});

/**
 * The interactive checks — the one piece of content authored for the site rather than
 * derived from `phases/`. Keyed by lesson slug so a lesson page can pick up its own.
 */
const checks = defineCollection({
  loader: file("src/content/checks.json", {
    parser: (text: string): Record<string, Record<string, unknown>> => {
      const groups = JSON.parse(text) as Record<string, Record<string, unknown>[]>;
      // `file()` wants a flat record keyed by id. The authoring format is grouped by
      // lesson, which is far easier to read and edit, so flatten it here.
      const out: Record<string, Record<string, unknown>> = {};
      for (const [lesson, items] of Object.entries(groups)) {
        items.forEach((item, index) => {
          const id = `${lesson}--${index}`;
          out[id] = { ...item, id, lesson, index };
        });
      }
      return out;
    },
  }),
  schema: z.object({
    id: z.string(),
    lesson: z.string(),
    index: z.number(),
    kind: z.enum(["mcq", "predict"]),
    prompt: z.string(),
    /** Optional code shown above the question. */
    code: z.string().optional(),
    options: z
      .array(
        z.object({
          text: z.string(),
          correct: z.boolean().default(false),
          /** Shown after answering — why this option is right or wrong. */
          explain: z.string(),
        }),
      )
      .default([]),
    /** Closing note shown once the learner answers correctly. */
    takeaway: z.string().optional(),
  }),
});

export const collections = { phases, lessons, checks };
