/**
 * Build-time content loaders that read the curriculum straight out of `phases/`.
 *
 * The stock `glob()` loader is not enough here, because these files were written for
 * GitHub rather than for this site and need three transforms before they can be rendered:
 *
 *  1. They have **no frontmatter**. The title is the leading H1, which then has to be
 *     removed so the page does not print it twice.
 *  2. Their links are repo-relative and must be rewritten (see `links.ts`).
 *  3. Their `- [ ]` exit criteria and `**Goal:**` lines need to come out of the prose and
 *     become interactive UI — that is the difference between this site and a docs mirror.
 *
 * Everything below reads the real files. Nothing is copied into the site, so editing a
 * lesson in `phases/` is the only way to change what the site shows.
 */

import type { Loader, LoaderContext } from "astro/loaders";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rewriteLinks, splitTitle } from "./links.ts";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPO_ROOT = resolve(SITE_ROOT, "..");

/** `- **Goal:** ...` (phase 1) and `**Goal:** ...` (phases 2-8) are both in use. */
function extractMeta(markdown: string, label: string): string | undefined {
  const pattern = new RegExp(`^\\s*(?:-\\s*)?\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
  return pattern.exec(markdown)?.[1]?.trim().replace(/\s{2,}$/, "");
}

/** Remove the meta lines once they have been hoisted into the page header. */
function stripMeta(markdown: string): string {
  return markdown
    .replace(/^\s*(?:-\s*)?\*\*(?:Goal|You build|Effort):\*\*\s*.+$/gim, "")
    .replace(/^\n{2,}/, "");
}

export interface ExitCriterion {
  index: number;
  text: string;
}

/**
 * Pull a phase doc's exit-criteria checklist out of the prose.
 *
 * The checklist is removed from the body because the page renders it as a persisted,
 * tickable list instead — across the eight phases these are the main progress signal for
 * everything that has no lessons yet.
 *
 * The section is located by **content, not by name**: whichever H2 contains `- [ ]` items
 * is the checklist. Seven phases call it "Exit criteria" and the capstone calls it "Done
 * means", so matching on the title silently dropped six criteria from phase 8. Each doc has
 * exactly one such section, and its heading is returned so the page can keep the doc's own
 * wording.
 */
function extractExitCriteria(markdown: string): {
  criteria: ExitCriterion[];
  heading: string;
  body: string;
} {
  const TASK_ITEM = /^\s*-\s*\[[ xX]\]\s*(.+)$/gm;
  const headings = [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)];

  for (const [index, heading] of headings.entries()) {
    const start = heading.index;
    const end = headings[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(start, end);

    const criteria: ExitCriterion[] = [];
    for (const match of section.matchAll(TASK_ITEM)) {
      criteria.push({ index: criteria.length, text: match[1]!.trim() });
    }
    if (criteria.length === 0) continue;

    return {
      criteria,
      heading: heading[1]!.trim(),
      body: (markdown.slice(0, start) + markdown.slice(end)).trim(),
    };
  }

  return { criteria: [], heading: "Exit criteria", body: markdown };
}

interface MarkdownLoaderOptions {
  /** Repo-relative directory to read, e.g. `phases`. */
  dir: string;
  /** Only files matching this are loaded. */
  match: RegExp;
  /** Phase docs get their exit criteria hoisted; lessons have none. */
  hoistCriteria: boolean;
}

/**
 * Build a loader over a directory of curriculum markdown.
 *
 * @param options - Which files to read and how to treat them.
 * @returns An Astro content loader.
 */
export function curriculumLoader(options: MarkdownLoaderOptions): Loader {
  const { dir, match, hoistCriteria } = options;

  // Watchers survive across loader runs, so registering handlers on every `load` would
  // stack duplicates and re-process each edit N times.
  let watching = false;

  return {
    name: `curriculum:${dir}`,
    load: async (context: LoaderContext): Promise<void> => {
      const { store, parseData, renderMarkdown, config, logger, watcher } = context;
      const absoluteDir = join(REPO_ROOT, dir);

      /** Read one markdown file, transform it, and put it in the store. */
      const loadFile = async (file: string): Promise<void> => {
        const absolutePath = join(absoluteDir, file);
        const raw = await readFile(absolutePath, "utf-8");

        const { title, body: withoutTitle } = splitTitle(raw);
        const {
          criteria,
          heading: criteriaHeading,
          body: withoutCriteria,
        } = hoistCriteria
          ? extractExitCriteria(withoutTitle)
          : { criteria: [] as ExitCriterion[], heading: "Exit criteria", body: withoutTitle };

        const markdown = rewriteLinks(stripMeta(withoutCriteria), {
          sourceDir: dir,
          base: config.base,
        });

        const id = file.replace(/\.md$/, "");
        const rendered = await renderMarkdown(markdown, {
          fileURL: new URL(`file://${absolutePath}`),
        });

        const data = await parseData({
          id,
          filePath: relative(SITE_ROOT, absolutePath),
          data: {
            title,
            number: /^(\d{2})/.exec(id)?.[1] ?? "",
            goal: extractMeta(raw, "Goal"),
            youBuild: extractMeta(raw, "You build"),
            effort: extractMeta(raw, "Effort"),
            exitCriteria: criteria,
            exitCriteriaHeading: criteriaHeading,
            sourcePath: `${dir}/${file}`,
          },
        });

        store.set({
          id,
          data,
          body: markdown,
          filePath: relative(SITE_ROOT, absolutePath),
          digest: context.generateDigest(markdown),
          rendered,
        });
      };

      store.clear();

      const entries: string[] = await readdir(absoluteDir);
      const files = entries.filter((name) => match.test(name)).sort();
      for (const file of files) await loadFile(file);

      logger.info(`Loaded ${files.length} file(s) from ${dir}/`);

      // In `astro dev`, editing a lesson in `phases/` must refresh the page.
      //
      // `watcher.add()` alone is not enough — it only tells chokidar to observe the path.
      // Astro re-runs loaders for content inside `srcDir`, but these files live outside
      // the site entirely, so nothing reacts unless we handle the event ourselves and
      // update the store. Without this the dev server silently serves stale lessons.
      if (watcher && !watching) {
        watching = true;
        watcher.add(absoluteDir);

        const reload = (changedPath: string): void => {
          if (dirname(changedPath) !== absoluteDir) return;
          const file = basename(changedPath);
          if (!match.test(file)) return;

          void loadFile(file)
            .then(() => logger.info(`Reloaded ${dir}/${file}`))
            .catch((error: unknown) => {
              // A malformed edit must not take the dev server down mid-session.
              logger.error(
                `Failed to reload ${dir}/${file}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            });
        };

        watcher.on("change", reload);
        watcher.on("add", reload);
      }
    },
  };
}
