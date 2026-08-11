/**
 * Sweeps every page type for runtime errors and accessibility problems.
 *
 * `verify:browser` drives one deep flow on one page. This does the opposite: it visits
 * every kind of page, hydrates every island, and reports anything the browser complains
 * about — uncaught errors, failed requests, non-2xx responses — plus the accessibility
 * issues Astro's dev-toolbar audit surfaces.
 *
 * Needs a server running (`npm run dev` or `npm run preview`):
 *
 *   node scripts/audit-pages.mjs [baseURL]
 */

import { firefox } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:4321/learn-ai-engineering";

const PAGES = [
  ["dashboard", "/"],
  ["phase 1 (has lessons)", "/phases/01-foundations"],
  ["phase 8 (capstone)", "/phases/08-capstone"],
  ["lesson 01", "/learn/01-core-mechanics"],
  ["lesson 07 (classes)", "/learn/07-oop-just-enough"],
  ["lesson 11 (sql, ungraded)", "/learn/11-a-little-sql"],
  ["about", "/about"],
  ["progress", "/progress"],
  ["404", "/does-not-exist"],
];

/**
 * Browser noise that is not ours to fix.
 *
 * Firefox warns about `scroll-behavior: smooth` with a sticky header, and about a
 * deprecated WASM opcode emitted by Pyodide's own build. Neither is actionable here, and
 * leaving them in drowns out real findings.
 */
const IGNORED = [
  /scroll-linked positioning effect/i,
  /WebAssembly exception handling 'try' instruction is deprecated/i,
  /downloadable font/i,
];

const browser = await firefox.launch();
let total = 0;

for (const [label, path] of PAGES) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const problems = [];

  const note = (message) => {
    if (!IGNORED.some((pattern) => pattern.test(message))) problems.push(message);
  };

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      note(`[console.${message.type()}] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => note(`[uncaught] ${error.message}`));
  page.on("requestfailed", (request) =>
    note(`[request failed] ${request.url()} — ${request.failure()?.errorText}`),
  );
  page.on("response", (response) => {
    // The 404 page is expected to be served with a 404 status.
    if (response.status() >= 400 && !path.includes("does-not-exist")) {
      note(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  await page
    .goto(`${BASE}${path}`, { waitUntil: "networkidle" })
    .catch((error) => note(`[navigation] ${error.message}`));

  // Scroll to the bottom so every `client:visible` island hydrates.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  const a11y = await page.evaluate(() => {
    const found = [];
    const describe = (el) =>
      `<${el.tagName.toLowerCase()}${
        typeof el.className === "string" && el.className ? ` class="${el.className.slice(0, 40)}…"` : ""
      }>`;

    // `??` would stop at an empty string, so fall through on any blank candidate.
    const accessibleName = (el) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      const candidates = [
        el.getAttribute("aria-label"),
        labelledBy ? document.getElementById(labelledBy)?.textContent : null,
        el.textContent,
        el.getAttribute("title"),
        el.querySelector("img[alt]")?.getAttribute("alt"),
      ];
      return candidates.find((value) => value && value.trim() !== "")?.trim() ?? "";
    };

    for (const el of document.querySelectorAll("button")) {
      if (!accessibleName(el)) found.push(`button with no accessible name: ${describe(el)}`);
    }
    for (const el of document.querySelectorAll("a[href]")) {
      if (!accessibleName(el)) found.push(`link with no accessible name: ${describe(el)}`);
    }
    for (const el of document.querySelectorAll("img")) {
      if (!el.hasAttribute("alt")) found.push(`img with no alt: ${el.getAttribute("src")}`);
    }
    for (const el of document.querySelectorAll("input, select, textarea")) {
      const labelled =
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        el.closest("label") ||
        (el.id && document.querySelector(`label[for="${el.id}"]`));
      if (!labelled) {
        found.push(`form control with no label: <${el.tagName.toLowerCase()} type="${el.getAttribute("type")}">`);
      }
    }

    let previous = 0;
    for (const el of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const level = Number(el.tagName[1]);
      if (previous && level > previous + 1) {
        found.push(`heading jumps h${previous} → h${level}: "${el.textContent.trim().slice(0, 40)}"`);
      }
      previous = level;
    }
    const h1s = document.querySelectorAll("h1").length;
    if (h1s !== 1) found.push(`expected exactly one h1, found ${h1s}`);

    return found;
  });

  problems.push(...a11y);

  const unique = [...new Set(problems)];
  console.log(`\n### ${label}  (${path})`);
  if (unique.length === 0) {
    console.log("  clean");
  } else {
    total += unique.length;
    for (const problem of unique) console.log(`  ${problem}`);
  }

  await context.close();
}

await browser.close();
console.log(`\n${total === 0 ? "All pages clean." : `${total} problem(s) found.`}`);
process.exit(total === 0 ? 0 : 1);
