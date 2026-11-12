/**
 * The search palette's index, written to `dist/search-index.json` at build time.
 *
 * It is a static endpoint rather than data inlined into pages, so it is only downloaded
 * when someone opens search. Like every other page it is derived from `phases/`, so a new
 * lesson or section shows up in search on the next build with nothing to update by hand.
 */

import type { APIRoute, MarkdownHeading } from "astro";
import { getCollection, render, type CollectionEntry } from "astro:content";
import { href } from "../lib/href.ts";
import { topicByLessonSlug } from "../lib/curriculum.ts";
import type { SearchEntry } from "../lib/search.ts";

/**
 * Headings at the given depths.
 *
 * Read through `render()` rather than `entry.rendered.metadata`. They hold the same data,
 * but the generated `astro:content` types declare `metadata` as `[key: string]: unknown`,
 * so only `render()` returns headings typed as headings. For entries from our loader it is
 * cheap: the HTML was rendered at load time and is only wrapped here.
 */
async function headingsOf(
  entry: CollectionEntry<"phases" | "lessons" | "role">,
  depths: readonly number[],
): Promise<MarkdownHeading[]> {
  const { headings } = await render(entry);
  return headings.filter((heading) => depths.includes(heading.depth));
}

export const GET: APIRoute = async () => {
  const entries: SearchEntry[] = [
    { title: "Dashboard", href: href("/"), kind: "page", text: "home continue progress next" },
    { title: "The roadmap", href: href("/#roadmap"), kind: "page", context: "All eight phases" },
    { title: "Your progress", href: href("/progress"), kind: "page", context: "Every phase at a glance", text: "how far percent complete done status export import reset backup" },
    { title: "About", href: href("/about"), kind: "page", text: "how this site works" },
  ];

  const phases = (await getCollection("phases")).sort((a, b) => a.id.localeCompare(b.id));
  for (const phase of phases) {
    const route = `/phases/${phase.id}`;
    const where = `Phase ${Number(phase.data.number)} · ${phase.data.title}`;
    entries.push({
      title: phase.data.title,
      href: href(route),
      kind: "phase",
      context: `Phase ${Number(phase.data.number)}`,
      text: [phase.data.goal, phase.data.youBuild].filter(Boolean).join(" "),
    });
    for (const heading of await headingsOf(phase, [2])) {
      entries.push({ title: heading.text, href: href(`${route}#${heading.slug}`), kind: "section", context: where });
    }
    if (phase.data.exitCriteria.length > 0) {
      entries.push({
        title: phase.data.exitCriteriaHeading,
        href: href(`${route}#exit-criteria`),
        kind: "section",
        context: where,
      });
    }
  }

  const lessons = (await getCollection("lessons")).sort((a, b) => a.id.localeCompare(b.id));
  for (const lesson of lessons) {
    const route = `/learn/${lesson.id}`;
    const topic = topicByLessonSlug(lesson.id);
    const where = topic ? `Phase 1 · Topic ${topic.number}` : "Phase 1 · Part A";
    entries.push({ title: lesson.data.title, href: href(route), kind: "lesson", context: where });
    for (const heading of await headingsOf(lesson, [2, 3])) {
      entries.push({
        title: heading.text,
        href: href(`${route}#${heading.slug}`),
        kind: "section",
        context: lesson.data.title,
      });
    }
    if (topic) {
      entries.push({ title: "Drills", href: href(`${route}#drills`), kind: "section", context: lesson.data.title });
    }
  }

  const [role] = await getCollection("role");
  if (role) {
    entries.push({ title: role.data.title, href: href("/role"), kind: "page", text: "job market salary interview" });
    for (const heading of await headingsOf(role, [2])) {
      entries.push({ title: heading.text, href: href(`/role#${heading.slug}`), kind: "section", context: "The role" });
    }
  }

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
