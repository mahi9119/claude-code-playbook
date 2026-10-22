#!/usr/bin/env node
/**
 * check-doc-tables.mjs - guard the tracking-doc convention.
 *
 * Two checks over every doc listed in TRACKING_DOCS:
 *   1. Table alignment - every row's cell count matches its header's. A 4-column
 *      header with 3-column rows renders misaligned on GitHub and is easy to
 *      introduce when editing a wide table.
 *   2. Summary presence - the doc opens with a scannable summary table before the
 *      detail sections (see the "Tracking docs" rule in CLAUDE.md).
 *
 * Usage:
 *   node scripts/check-doc-tables.mjs          # check the tracked set
 *   node scripts/check-doc-tables.mjs <paths>  # check specific files
 *
 * Exits 1 on any violation - this runs inside preflight.
 */

import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Tracking docs. `summary: true` additionally requires an explicit SUMMARY heading.
 * `blocking: false` prints violations as WARN and does not fail the run: wire the
 * guard in now, opt out only the known pre-existing debt, rather than leaving the
 * whole guard advisory until every doc happens to pass.
 *
 * Alignment is checked everywhere - it is objective and a misaligned row is always a
 * rendering bug. Summary-presence is opt-in per doc, so existing docs can be
 * converted one at a time. Flip each to `true` as it is converted.
 *
 * Classic cause of misalignment: a literal `|` inside an inline code span (a TS union,
 * `||`) that markdown reads as a cell delimiter. Escape it as `\|`.
 */
const TRACKING_DOCS = [
  { path: "docs/decisions.md", summary: true, blocking: true },
  { path: "docs/lessons.md", summary: true, blocking: true },
  { path: "docs/bug-tracker.md", summary: true, blocking: true },
  { path: "docs/progress.md", summary: false, blocking: true },
];

/** Heading that satisfies the summary check, case-insensitive. */
const SUMMARY_HEADING = /^#{1,3}\s+(summary|index|at a glance)\b/i;

const SEPARATOR_ROW = /^\|[\s:|-]+\|$/;

/**
 * Count cells in a table row.
 *
 * `\|` is an escaped literal pipe - GitHub renders it inside the cell and does NOT
 * split on it, so it must not be counted as a separator. Strip escaped pipes first,
 * otherwise every correctly-escaped row reads as misaligned (which is exactly the
 * false positive this linter produced on its own lessons.md entry).
 */
function cellCount(trimmed) {
  const unescaped = trimmed.replace(/\\\|/g, "\u0000");
  return unescaped.replace(/^\|/, "").replace(/\|$/, "").split("|").length;
}

/** Returns { alignment: string[], hasSummary: boolean, tableCount: number } */
function inspect(text) {
  const lines = text.split(/\r?\n/);
  const alignment = [];
  let header = null;
  let headerLine = 0;
  let tableCount = 0;
  let inFence = false;
  let hasSummary = false;
  let firstTableLine = Infinity;
  let summaryLine = Infinity;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      header = null;
      return;
    }
    if (inFence) return;

    if (SUMMARY_HEADING.test(trimmed) && summaryLine === Infinity) {
      hasSummary = true;
      summaryLine = i;
    }

    if (!trimmed.startsWith("|")) {
      header = null;
      return;
    }

    if (header === null) {
      header = cellCount(trimmed);
      headerLine = i + 1;
      tableCount += 1;
      firstTableLine = Math.min(firstTableLine, i);
      return;
    }
    if (SEPARATOR_ROW.test(trimmed)) return;

    const cells = cellCount(trimmed);
    if (cells !== header) {
      alignment.push(
        `line ${i + 1}: ${cells} cells, but header on line ${headerLine} has ${header}`,
      );
    }
  });

  return { alignment, hasSummary, tableCount };
}

const argPaths = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const targets =
  argPaths.length > 0
    ? argPaths.map((p) => ({ path: p, summary: true, blocking: true }))
    : TRACKING_DOCS;

let failures = 0;
let warnings = 0;
let checked = 0;

for (const { path: rel, summary: requireSummary, blocking } of targets) {
  const abs = join(ROOT, rel);
  let text;
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    // A tracked doc that no longer exists is a stale list entry, not a doc bug.
    console.log(`  SKIP ${rel} (not found - remove it from TRACKING_DOCS?)`);
    continue;
  }
  checked += 1;

  const { alignment, hasSummary, tableCount } = inspect(text);
  const problems = [];

  for (const a of alignment) problems.push(`misaligned table row - ${a}`);
  if (requireSummary && tableCount > 0 && !hasSummary) {
    problems.push(
      "no summary/index heading - a tracking doc opens with a SUMMARY table, then DETAIL (see CLAUDE.md)",
    );
  }

  if (problems.length === 0) {
    console.log(`  OK   ${rel} (${tableCount} table${tableCount === 1 ? "" : "s"})`);
  } else if (blocking) {
    failures += problems.length;
    console.log(`  FAIL ${rel}`);
    for (const p of problems) console.log(`         ${p}`);
  } else {
    warnings += problems.length;
    console.log(`  WARN ${rel} (opted out of blocking - see TRACKING_DOCS)`);
    for (const p of problems) console.log(`         ${p}`);
  }
}

console.log("");
if (failures === 0) {
  const warnMsg = warnings > 0 ? `, ${warnings} non-blocking warning${warnings === 1 ? "" : "s"}` : "";
  console.log(`Doc tables OK - ${checked} file${checked === 1 ? "" : "s"} checked${warnMsg}.`);
  process.exit(0);
}
console.log(
  `Doc tables FAILED - ${failures} problem${failures === 1 ? "" : "s"} across ${checked} file${checked === 1 ? "" : "s"}.`,
);
process.exit(1);
