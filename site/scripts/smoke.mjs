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

console.log("\nLesson page");
await page.goto(LESSON, { waitUntil: "networkidle" });
check("renders the lesson prose", (await page.locator("article.prose table").count()) > 0);
check("renders comprehension checks", (await page.getByText("Predict the output").count()) > 0);

// Answering a check should persist. The checks are a `client:visible` island, so they
// have to be scrolled to before they hydrate and respond to a click.
const firstOption = page.locator("aside button").first();
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
