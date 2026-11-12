/**
 * Base-path-aware URL building.
 *
 * The site is served from `/learn-ai-engineering/` on GitHub Pages but from `/` in most
 * local setups, so no link may be written as a bare absolute path. Every internal `href`
 * in the app goes through here.
 */

/** Astro injects the configured base; it may or may not carry a trailing slash. */
const RAW_BASE: string = import.meta.env.BASE_URL ?? "/";

export const BASE: string = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;

/**
 * Prefix an internal route with the site's base path.
 *
 * @param route - A root-relative route such as `/learn/01-core-mechanics`.
 * @returns The full path to link to.
 */
export function href(route: string): string {
  if (route === "/") return BASE === "" ? "/" : `${BASE}/`;
  return `${BASE}${route.startsWith("/") ? route : `/${route}`}`;
}

/**
 * Whether two paths name the same page.
 *
 * `trailingSlash: "ignore"` means `/learn/x` and `/learn/x/` both serve the same page, and
 * the browser may report either, so "is this the current page?" must not depend on it.
 */
export function isSamePath(a: string, b: string): boolean {
  const trim = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  return trim(a) === trim(b);
}
