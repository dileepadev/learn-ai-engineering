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
