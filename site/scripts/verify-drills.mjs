/**
 * Proves that every Part A drill still runs in Pyodide.
 *
 * The site's whole premise is that the repo's real pytest suites execute in the browser.
 * Nothing else in the test setup would catch a change that breaks that — `uv run pytest`
 * passes locally on CPython whether or not the same code works under WASM, and an Astro
 * build never executes a drill.
 *
 * So this runs the actual code path the browser uses:
 *
 *   curriculum.json  ->  assemble module from solutions  ->  driver.py in Pyodide
 *
 * It uses the same `driver.py` the worker loads, so the two cannot drift apart.
 *
 *   node scripts/verify-drills.mjs
 *
 * Exits non-zero if any graded topic fails to go fully green.
 */

import { loadPyodide } from "pyodide";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(SITE_ROOT, "src/generated");
const DRIVER = join(SITE_ROOT, "src/workers/driver.py");

const readJson = async (path) => JSON.parse(await readFile(path, "utf-8"));

/**
 * Rebuild a drill module from its parts.
 *
 * Mirrors `assembleModule` in src/lib/runner.ts, including the editable preamble — which
 * exists precisely because this script proved several topics cannot be completed without
 * adding an import.
 */
function assembleModule(topic, preamble, pick) {
  const bodies = topic.exercises.map((exercise) => pick(exercise));
  return `${preamble}\n\n\n${bodies.join("\n\n\n")}\n`;
}

/** Strip comments and blank lines so two spellings of the same module compare equal. */
function normalise(source) {
  return source
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"))
    .join("\n");
}

const index = await readJson(join(GENERATED, "curriculum.json"));
const runtime = await readJson(join(GENERATED, "runtime.json"));
const driver = await readFile(DRIVER, "utf-8");

// Load the same per-topic detail files the browser fetches on demand.
const graded = [];
for (const summary of index.topics.filter((topic) => topic.graded)) {
  graded.push(await readJson(join(GENERATED, "topics", `${summary.id}.json`)));
}

console.log(`Booting Pyodide for ${graded.length} graded topics…`);
const py = await loadPyodide();
await py.loadPackage("pytest");

py.FS.mkdirTree("/part-a/drills");
py.FS.mkdirTree("/part-a/solutions");
py.FS.mkdirTree("/part-a/tests");

const write = (path, contents) =>
  py.FS.writeFile(`/part-a/${path}`, contents, { encoding: "utf8" });

write("conftest.py", runtime.conftest);
write("drills/__init__.py", runtime.drillsInit);

py.runPython(driver);

let failures = 0;
let totalTests = 0;

for (const topic of graded) {
  // 1. Assembling from stubs must reproduce the real drill file. If this drifts, the
  //    editor would be showing the learner something other than what actually runs.
  const fromStubs = assembleModule(topic, topic.preamble, (exercise) => exercise.stub);
  if (normalise(fromStubs) !== normalise(topic.stubSource)) {
    console.error(`  ✗ ${topic.id}: assembling from stubs does not reproduce the drill file`);
    failures += 1;
    continue;
  }

  // 2. The answer key must make the whole suite green under Pyodide.
  //
  //    Written verbatim rather than reassembled: several solutions introduce top-level
  //    names the drill has no slot for (`MissingFieldError`, `CHARS_PER_TOKEN`), because
  //    defining them is part of the exercise. A learner types those into the exercise's
  //    editor and text concatenation puts them at module level — but reassembling
  //    *from the drill's* definition list here would drop them and fail spuriously.
  //    Step 1 already proves the assembly logic is faithful.
  write(`drills/d${topic.id}.py`, topic.solutionSource);
  write(`tests/${topic.testModule}`, topic.testSource);

  py.runPython(`OUT = run_suite(${JSON.stringify(topic.testModule)})`);
  const outcome = JSON.parse(py.globals.get("OUT"));

  if (outcome.collectError) {
    console.error(`  ✗ ${topic.id}: collection failed\n${outcome.collectError}`);
    failures += 1;
    continue;
  }

  const failed = outcome.results.filter((result) => result.outcome !== "passed");
  totalTests += outcome.results.length;

  // 3. Every test must map to an exercise, or its result would never reach the UI.
  const mapped = new Set(topic.exercises.flatMap((exercise) => exercise.tests));
  const unmapped = outcome.results.filter((result) => !mapped.has(result.name));

  if (failed.length === 0 && unmapped.length === 0) {
    console.log(`  ✓ ${topic.id.padEnd(24)} ${outcome.results.length} tests`);
  } else {
    failures += 1;
    console.error(`  ✗ ${topic.id}: ${failed.length} failed, ${unmapped.length} unmapped`);
    for (const result of failed.slice(0, 3)) {
      console.error(`      ${result.name}: ${result.message.split("\n").slice(-1)[0]}`);
    }
    for (const result of unmapped.slice(0, 3)) {
      console.error(`      unmapped: ${result.name}`);
    }
  }
}

console.log(
  failures === 0
    ? `\nAll ${graded.length} topics green — ${totalTests} tests passed in Pyodide.`
    : `\n${failures} topic(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
