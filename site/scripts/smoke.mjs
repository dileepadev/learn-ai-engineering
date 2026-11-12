/**
 * End-to-end smoke test in a real browser.
 *
 * `verify-drills.mjs` proves the Python works under Pyodide, but it runs in Node. This
 * proves the part only a browser can: that the Web Worker boots, that Pyodide loads from
 * the CDN inside it, that a learner's edit reaches the runner, and that a pass is written
 * to localStorage and survives a reload.
 *
 * Requires a build and a running preview server:
 *
 *   npm run build && npm run preview &
 *   node scripts/smoke.mjs [baseURL]
 */

import { firefox } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:4321/learn-ai-engineering";
const LESSON = `${BASE}/learn/01-core-mechanics`;

// The real answers to topic 01's first two exercises, typed the way a learner would.
const UNIQUE = `def unique_preserving_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out`;

const failures = [];
const check = (label, condition, detail = "") => {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const browser = await firefox.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(error.message));

console.log("Dashboard");
await page.goto(BASE, { waitUntil: "networkidle" });
check("renders the hero", await page.getByRole("heading", { level: 1 }).isVisible());
check(
  "shows a next action",
  (await page.getByText(/Start here|Continue where you left off/).count()) > 0,
);
check("lists all 12 Part A topics", (await page.locator('a[href*="/learn/"]').count()) >= 12);
check("lists all 8 phases", (await page.locator('a[href*="/phases/"]').count()) >= 8);

/** Islands lose their `ssr` attribute once hydrated; shortcuts do nothing before that. */
const hydrated = (name) =>
  page.waitForSelector(`astro-island[component-export="${name}"]:not([ssr])`, { timeout: 15_000 });

console.log("\nFinding your progress");
await hydrated("HeaderProgress");
const progressLink = page.locator("header").getByRole("link", { name: /^Progress/ });
check("the header has a link labelled Progress", await progressLink.isVisible());
await Promise.all([page.waitForURL(/\/progress$/), progressLink.click()]);
await page.getByRole("heading", { level: 1, name: "Your progress" }).waitFor({ timeout: 10_000 });
check(
  "it opens a page that lists every phase",
  (await page.locator('section[aria-labelledby="by-phase"] a[href*="/phases/"]').count()) === 8,
);
check(
  "the Progress link is marked as the current page",
  (await progressLink.getAttribute("aria-current")) === "page",
);
await page.goto(BASE, { waitUntil: "networkidle" });
check(
  "the dashboard ring links to it in words",
  (await page.getByRole("link", { name: /See your progress/ }).count()) === 1,
);

console.log("\nSearch and keyboard navigation");
await hydrated("CommandPalette");
await page.keyboard.press("Control+K");
const searchBox = page.getByRole("combobox", { name: /Search phases/ });
await searchBox.waitFor({ timeout: 10_000 });
check("Ctrl+K opens search", await searchBox.isVisible());
check(
  "an empty query offers quick actions",
  (await page.getByRole("option").count()) >= 4,
  `${await page.getByRole("option").count()} options`,
);
await searchBox.fill("decorators");
await page.getByRole("option", { name: /Decorators/ }).first().waitFor({ timeout: 10_000 });
await Promise.all([page.waitForURL(/\/learn\/09-/), page.keyboard.press("Enter")]);
check("Enter on a result opens the lesson", /\/learn\/09-/.test(page.url()), page.url());

await hydrated("LessonNav");
await Promise.all([page.waitForURL(/\/learn\/10-/), page.keyboard.press("ArrowRight")]);
check("→ goes to the next lesson", /\/learn\/10-/.test(page.url()), page.url());
// A new page means a new island: wait for this page's pager before pressing again.
await hydrated("LessonNav");
await Promise.all([page.waitForURL(/\/learn\/09-/), page.keyboard.press("ArrowLeft")]);
check("← goes back", /\/learn\/09-/.test(page.url()), page.url());

console.log("\nMobile menu");
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/phases/04-rag`, { waitUntil: "networkidle" });
await hydrated("MobileNav");
// Not "in the menu": on a phone the progress link must be there without opening anything.
check(
  "Progress is in the phone header, not only in the menu",
  await page.locator("header").getByRole("link", { name: /^Progress/ }).isVisible(),
);
await page.getByRole("button", { name: "Open menu" }).click();
const drawer = page.getByRole("dialog", { name: "Menu" });
await drawer.waitFor({ timeout: 10_000 });
check(
  "the drawer lists every phase",
  (await drawer.locator('a[href*="/phases/"]').count()) >= 8,
);
check(
  "the drawer marks the current page",
  (await drawer.locator('[aria-current="page"]').innerText()).includes("RAG"),
);
await page.keyboard.press("Escape");
await drawer.waitFor({ state: "hidden", timeout: 5_000 });
check("Esc closes the drawer", !(await drawer.isVisible()));
check(
  "no sideways scroll at phone width",
  await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
await page.setViewportSize({ width: 1280, height: 800 });

console.log("\nLesson page");
await page.goto(LESSON, { waitUntil: "networkidle" });
check("renders the lesson prose", (await page.locator("article.prose table").count()) > 0);
check("renders comprehension checks", (await page.getByText("Predict the output").count()) > 0);

// Answering a check should persist. The checks are a `client:visible` island, so they
// have to be scrolled to before they hydrate and respond to a click. Scoped to the checks
// section so no other `aside` on the page (a sidebar, say) can satisfy it by accident.
const firstOption = page.locator("#checks aside button").first();
await firstOption.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await firstOption.click();
await page.waitForTimeout(300);
const checksStored = await page.evaluate(() => {
  const raw = window.localStorage.getItem("lai:progress:v1");
  return raw ? Object.keys(JSON.parse(raw).checks ?? {}).length : 0;
});
check("records a check answer", checksStored > 0, `checks stored: ${checksStored}`);

console.log("\nDrill runner (this is the one that matters)");
await page.locator("#drills").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Run tests|Starting Python/ }).waitFor({ timeout: 30_000 });
check("mounts the runner", true);

// Type a real answer into the first exercise's editor.
const editor = page.locator(".cm-content").first();
await editor.waitFor({ timeout: 30_000 });
await editor.click();
await page.keyboard.press("ControlOrMeta+A");
await page.keyboard.insertText(UNIQUE);
check("accepts an edit in the editor", (await editor.innerText()).includes("seen.add(item)"));

// The guarantee the ←/→ shortcuts depend on: inside the editor, an arrow moves the cursor
// and never leaves the page (taking the learner's unsaved edit with it).
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(500);
check("arrows inside the editor stay on the page", page.url().startsWith(LESSON), page.url());

// Boot Pyodide and run the real suite. The component warms the runtime on idle, so the
// button reads "Starting Python…" and stays disabled until the ~10MB of wheels have
// landed — wait for it to settle back to "Run tests" rather than racing it.
console.log("  … booting Pyodide and running pytest (first boot downloads the runtime)");
const runButton = page.getByRole("button", { name: /Run tests/ });
await runButton.waitFor({ state: "visible", timeout: 240_000 });
await runButton.click({ timeout: 240_000 });
await page.getByText(/tests passed ·/).waitFor({ timeout: 240_000 });

const summary = await page.getByText(/tests passed ·/).innerText();
check("ran the real pytest suite", /\d+\/15 tests passed/.test(summary), summary);

const passed = Number(/(\d+)\/15/.exec(summary)?.[1] ?? 0);
check("the typed answer passes its tests", passed >= 2, `${passed}/15 passing`);
check(
  "unfinished exercises still fail",
  passed < 15,
  "a stubbed module should not be fully green",
);

const stored = await page.evaluate(() => {
  const raw = window.localStorage.getItem("lai:progress:v1");
  const state = raw ? JSON.parse(raw) : { exercises: {} };
  return Object.entries(state.exercises)
    .filter(([, value]) => value.passed)
    .map(([key]) => key);
});
check(
  "writes the pass to localStorage",
  stored.includes("01_core_mechanics.unique_preserving_order"),
  JSON.stringify(stored),
);

console.log("\nPersistence");
await page.reload({ waitUntil: "networkidle" });
await page.locator("#drills").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
const summaryAfter = await page.locator("text=/\\d+ \\/ \\d+ passing/").first().innerText();
check("progress survives a reload", /^[1-9]/.test(summaryAfter.trim()), summaryAfter);

await page.goto(BASE, { waitUntil: "networkidle" });
const dashText = await page.locator("body").innerText();
check("the dashboard reflects it", /1 of 7 drills done|drills done/.test(dashText));

check("no uncaught page errors", consoleErrors.length === 0, consoleErrors.join("; "));

await browser.close();

console.log(
  failures.length === 0
    ? "\nAll browser checks passed."
    : `\n${failures.length} check(s) failed: ${failures.join(", ")}`,
);
process.exit(failures.length === 0 ? 0 : 1);
