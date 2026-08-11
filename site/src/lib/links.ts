/**
 * Rewrites the repo-relative links inside the curriculum markdown into site routes.
 *
 * The markdown in `phases/` is written to be read on GitHub, so its links point at real
 * files: `lessons/00-python-basics.md`, `../../01-foundations.md`, `drills/d01_core_mechanics.py`.
 * Left alone, every one of those 404s on the site.
 *
 * The rewrite happens here, on the markdown string, rather than in a rehype plugin. That
 * keeps it independent of whichever Markdown pipeline Astro ships — a live concern, since
 * Astro 7 replaced remark/rehype with a different processor.
 *
 * Two destinations:
 *  - a file the site has a page for  -> that page's route
 *  - anything else (`.py`, `.sql`, `.yml`) -> the file on GitHub, so the link still works
 */

const GITHUB_BLOB = "https://github.com/dileepadev/learn-ai-engineering/blob/main";

/** Links we never touch: absolute URLs, anchors, and protocol-relative URLs. */
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Markdown inline links and images — `[text](target)` / `![alt](target)` — plus reference
 * definitions on their own line (`[label]: target`). Titles after the target are preserved.
 */
const INLINE_LINK = /(!?\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g;
const REFERENCE_LINK = /^(\s*\[[^\]]+\]:\s+)(\S+)/gm;

/**
 * Resolve a relative path against a directory, collapsing `.` and `..`.
 *
 * Node's `path.posix.resolve` would do this, but this module is imported by both the
 * build-time loader and the browser bundle, so it stays dependency-free.
 */
function resolveRepoPath(fromDir: string, target: string): string {
  const segments = target.startsWith("/")
    ? target.slice(1).split("/")
    : [...fromDir.split("/"), ...target.split("/")];

  const out: string[] = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") out.pop();
    else out.push(segment);
  }
  return out.join("/");
}

/**
 * Map a repo-relative file path to the site route that renders it, if one exists.
 *
 * @returns The route (without the base prefix), or null when no page covers the file.
 */
export function routeForRepoPath(repoPath: string): string | null {
  // The roadmap docs: phases/03-prompting-and-structured-outputs.md
  const phase = /^phases\/(\d{2}-[a-z0-9-]+)\.md$/.exec(repoPath);
  if (phase) return `/phases/${phase[1]}`;

  // Part A lessons: phases/01-foundations/part-a/lessons/05-files-and-json.md
  const lesson = /^phases\/01-foundations\/part-a\/lessons\/(\d{2}-[a-z0-9-]+)\.md$/.exec(repoPath);
  if (lesson) return `/learn/${lesson[1]}`;

  // Part A's own index page is folded into the Phase 1 overview.
  if (repoPath === "phases/01-foundations/part-a/README.md") return "/phases/01-foundations";

  if (repoPath === "README.md") return "/";

  return null;
}

/** Join the site's base path with a route, avoiding a doubled slash. */
export function withBase(base: string, route: string): string {
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return route === "/" ? trimmed || "/" : `${trimmed}${route}`;
}

export interface RewriteOptions {
  /** Repo-relative directory of the markdown file, e.g. `phases/01-foundations/part-a/lessons`. */
  sourceDir: string;
  /** The site's configured base path, e.g. `/learn-ai-engineering`. */
  base: string;
}

/**
 * Rewrite every repo-relative link in a markdown document.
 *
 * @param markdown - The raw markdown source.
 * @param options - Where the file lives, and the site's base path.
 * @returns The markdown with its links pointing at site routes or GitHub.
 */
export function rewriteLinks(markdown: string, options: RewriteOptions): string {
  const { sourceDir, base } = options;

  const rewriteTarget = (target: string): string => {
    if (EXTERNAL.test(target)) return target;

    // Keep any fragment: `../../01-foundations.md#exit-criteria` must survive intact.
    const hashIndex = target.indexOf("#");
    const path = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : target.slice(hashIndex);

    // A bare fragment was already handled by EXTERNAL; an empty path here means the
    // link was only a query or something we do not understand. Leave it alone.
    if (path === "") return target;

    const repoPath = resolveRepoPath(sourceDir, path);
    const route = routeForRepoPath(repoPath);
    return route ? `${withBase(base, route)}${hash}` : `${GITHUB_BLOB}/${repoPath}${hash}`;
  };

  return markdown
    .replace(INLINE_LINK, (_match, open: string, target: string, close: string) =>
      `${open}${rewriteTarget(target)}${close}`,
    )
    .replace(REFERENCE_LINK, (_match, open: string, target: string) =>
      `${open}${rewriteTarget(target)}`,
    );
}

/**
 * Strip the leading H1 from a markdown document and return both parts.
 *
 * The curriculum files carry no frontmatter — the H1 *is* the title. Pages render their
 * own header from it, so leaving it in the body would show the title twice.
 *
 * @param markdown - The raw markdown source.
 * @returns The title (H1 text, minus any `NN — ` prefix) and the remaining body.
 */
export function splitTitle(markdown: string): { title: string; body: string } {
  const lines = markdown.split("\n");
  const index = lines.findIndex((line) => line.startsWith("# "));
  if (index === -1) return { title: "", body: markdown };

  const heading = lines[index]!.replace(/^#\s+/, "").trim();
  const body = [...lines.slice(0, index), ...lines.slice(index + 1)].join("\n").trim();

  // "Phase 2 — LLMs & Model APIs" and "01 — Core mechanics" both split on the em dash.
  const dash = heading.indexOf("—");
  const title = dash === -1 ? heading : heading.slice(dash + 1).trim();
  return { title, body };
}
