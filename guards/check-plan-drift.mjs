#!/usr/bin/env node
/**
 * check-plan-drift.mjs - catch deliverables that were planned but never built.
 *
 * The failure this exists for: a phase specified a UI change to a progress stepper,
 * an approved mockup was drawn, and the stepper was never touched. The phase shipped,
 * moved to Completed, and the gap surfaced much later from a screenshot. Nothing caught
 * it because the plan's Verification section - which named the exact deliverable as
 * item #10 - was a numbered prose list with no state. A checklist nobody can mark is a
 * wish, not a gate.
 *
 * Assumed layout (change the constants below to match yours):
 *   - plan files:   docs/plans/Plan_Phase<N>[_to_<M>]_<Topic>.md
 *   - tracker:      docs/progress.md, with a "## Completed Phases" table whose first
 *                   column is the phase number
 *
 * Four checks:
 *   1. Verification section exists.
 *   2. Its items are checkboxes, so their state is readable by a human and a script.
 *   3. A phase sitting in progress.md's Completed table has no unchecked items.
 *      This is the check that would have caught the missing stepper.
 *   4. Design assets (mockups, reference images) are referenced by some plan -
 *      an orphaned mockup is a deliverable that lost its owner.
 *
 * Checks 1-3 are watermarked at ENFORCE_FROM_PHASE so pre-existing plans do not
 * turn this red on day one. A guard that is red by default gets switched off; an
 * advisory one gets ignored. Narrow and green beats broad and muted. Convert a
 * legacy plan by adding it to OPT_IN.
 *
 * Usage:
 *   node scripts/check-plan-drift.mjs           # enforce + report legacy backlog
 *   node scripts/check-plan-drift.mjs --all     # enforce over EVERY plan (backlog triage)
 *
 * Exits 1 on any violation.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Assumes this script lives one level below the repo root (e.g. scripts/).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS_DIR = join(ROOT, "docs/plans");
const PROGRESS = join(ROOT, "docs/progress.md");

/**
 * Plans for phases >= this number must satisfy checks 1-3. Set it to your "next
 * available phase number" on the day you add the guard, so it binds every plan
 * written from now on and grandfathers everything already on disk.
 */
const ENFORCE_FROM_PHASE = 1;

/** Legacy plans converted by hand. Add as you convert; never bulk-add. */
const OPT_IN = new Set([]);

/** Asset dirs scanned for orphans. `archived/` is deliberately excluded. */
const ASSET_DIRS = ["docs/plans/assets", "docs/plans/reference-images"];

const CHECKBOX = /^\s*[-*]\s+\[([ xX~])\]\s*(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const VERIFICATION_HEADING = /^\s*(?:\d+\.\s*)?verification\b/i;

/** Phase numbers a plan filename covers. `Plan_Phase185_to_186_X.md` -> [185,186]. */
function phasesFromFilename(name) {
  const m = name.match(/^Plan_Phase(\d+(?:\.\d+)?)(?:_to_(\d+))?/);
  if (!m) return [];
  const start = Math.floor(Number(m[1]));
  const end = m[2] ? Number(m[2]) : start;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [start];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Phase numbers listed under "## Completed Phases" in progress.md. */
function shippedPhases() {
  const lines = readFileSync(PROGRESS, "utf8").split(/\r?\n/);
  const shipped = new Set();
  let inCompleted = false;
  for (const line of lines) {
    const h = line.match(HEADING);
    if (h) {
      inCompleted = /^completed phases/i.test(h[2].trim());
      continue;
    }
    if (!inCompleted) continue;
    const cell = line.match(/^\|\s*(\d+)\s*\|/);
    if (cell) shipped.add(Number(cell[1]));
  }
  return shipped;
}

/** The Verification section's body lines, or null when there is no such heading. */
function verificationBody(text) {
  const lines = text.split(/\r?\n/);
  let level = null;
  const body = [];
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) inFence = !inFence;
    const h = inFence ? null : line.match(HEADING);
    if (h) {
      const depth = h[1].length;
      if (level === null) {
        if (VERIFICATION_HEADING.test(h[2])) level = depth;
        continue;
      }
      // A heading at the same or shallower depth ends the section.
      if (depth <= level) break;
    }
    if (level !== null) body.push(line);
  }
  return level === null ? null : body;
}

/** Items that look like checklist entries but carry no checkbox. */
function bareItems(body) {
  return body.filter((l) => {
    const t = l.trim();
    if (!t) return false;
    if (CHECKBOX.test(l)) return false;
    return /^(\d+\.|[-*])\s+\S/.test(t) && !/^[-*]\s*\*\*/.test(t);
  });
}

const args = process.argv.slice(2);
const enforceAll = args.includes("--all");

/**
 * `--phase-check N` - call this from your release script right before it moves
 * phase N to Completed. It runs BEFORE that move, so it cannot rely on Check 3 above
 * (which only looks at phases already listed under "## Completed Phases" - too
 * late, since the move hasn't happened yet). Finds every
 * plan file covering phase N and fails if any has no Verification section, or has
 * one or more unchecked ("- [ ]") items. Exits 0 with no plan file at all (some
 * phases predate the plan-authoring guardrails and were never given one - that is
 * a separate, pre-existing gap, not this guard's job to invent a plan for).
 */
const phaseCheckIdx = args.indexOf("--phase-check");
if (phaseCheckIdx !== -1) {
  const target = Number(args[phaseCheckIdx + 1]);
  if (!Number.isFinite(target)) {
    console.log("  FAIL --phase-check requires a numeric phase argument");
    process.exit(1);
  }
  // Sub-phases (e.g. 196.2) are floored to their parent phase for file matching -
  // plan filenames name the whole phase (Plan_Phase196_...), never a sub-phase.
  const flooredTarget = Math.floor(target);
  const covering = readdirSync(PLANS_DIR)
    .filter((f) => f.startsWith("Plan_Phase") && f.endsWith(".md"))
    .filter((f) => phasesFromFilename(f).includes(flooredTarget));

  if (covering.length === 0) {
    console.log(`  note  --phase-check ${target}: no plan file covers this phase, nothing to check.`);
    process.exit(0);
  }

  let failed = false;
  for (const file of covering) {
    const text = readFileSync(join(PLANS_DIR, file), "utf8");
    const body = verificationBody(text);
    if (body === null) {
      console.log(`  FAIL ${file}\n         no Verification section - cannot confirm phase ${target} is done`);
      failed = true;
      continue;
    }
    const open = [];
    for (const line of body) {
      const m = line.match(CHECKBOX);
      if (m && m[1] === " ") open.push(m[2].trim());
    }
    if (open.length > 0) {
      console.log(
        `  FAIL ${file}\n         ${open.length} Verification item(s) still unchecked for phase ` +
          `${target} - tick them, or mark "[~]" with a reason, before --phase ${target} ships ` +
          `(first: ${JSON.stringify(open[0].slice(0, 70))})`,
      );
      failed = true;
    }
  }
  if (failed) {
    console.log(`\n--phase-check ${target} FAILED - phase not moved to Completed.`);
    process.exit(1);
  }
  console.log(`  OK   --phase-check ${target}: Verification checkboxes all ticked in ${covering.join(", ")}.`);
  process.exit(0);
}

const planFiles = readdirSync(PLANS_DIR)
  .filter((f) => f.startsWith("Plan_Phase") && f.endsWith(".md"))
  .sort();

const shipped = shippedPhases();
const problems = [];
let enforcedCount = 0;
const legacy = { noVerification: 0, bareItems: 0 };

for (const file of planFiles) {
  const phases = phasesFromFilename(file);
  const maxPhase = phases.length ? Math.max(...phases) : 0;
  const enforced = enforceAll || OPT_IN.has(file) || maxPhase >= ENFORCE_FROM_PHASE;

  const text = readFileSync(join(PLANS_DIR, file), "utf8");
  const body = verificationBody(text);

  if (!enforced) {
    if (body === null) legacy.noVerification += 1;
    else if (bareItems(body).length > 0) legacy.bareItems += 1;
    continue;
  }
  enforcedCount += 1;

  // Check 1 - the section has to exist at all.
  if (body === null) {
    problems.push({
      file,
      msg: "no Verification section - every plan states how it will be proven done",
    });
    continue;
  }

  // Check 2 - items must carry state.
  const bare = bareItems(body);
  if (bare.length > 0) {
    problems.push({
      file,
      msg:
        `${bare.length} Verification item(s) are not checkboxes - use "- [ ] ..." so the ` +
        `state is readable (first: ${JSON.stringify(bare[0].trim().slice(0, 70))})`,
    });
  }

  // Check 3 - a shipped phase cannot carry unfinished verification.
  const shippedHere = phases.filter((p) => shipped.has(p));
  if (shippedHere.length === 0) continue;

  const open = [];
  for (const line of body) {
    const m = line.match(CHECKBOX);
    if (m && m[1] === " ") open.push(m[2].trim());
  }
  if (open.length > 0) {
    problems.push({
      file,
      msg:
        `phase ${shippedHere.join("/")} is in Completed but ${open.length} Verification ` +
        `item(s) are still unchecked - tick them, or mark "[~]" with a reason if descoped ` +
        `(first: ${JSON.stringify(open[0].slice(0, 70))})`,
    });
  }
}

// Check 4 - orphan design assets. No watermark: this is cheap and objective.
const allPlanText = planFiles.map((f) => readFileSync(join(PLANS_DIR, f), "utf8")).join("\n");
const orphans = [];
for (const rel of ASSET_DIRS) {
  const dir = join(ROOT, rel);
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    continue;
  }
  for (const name of entries) {
    if (statSync(join(dir, name)).isDirectory()) continue;
    if (!allPlanText.includes(name)) orphans.push(`${rel}/${name}`);
  }
}

// ---------------------------------------------------------------- report

for (const p of problems) console.log(`  FAIL ${p.file}\n         ${p.msg}`);
for (const o of orphans) {
  console.log(`  FAIL ${o}\n         design asset referenced by no plan file - link it or archive it`);
}
if (problems.length === 0 && orphans.length === 0) {
  console.log(
    `  OK   ${enforcedCount} enforced plan${enforcedCount === 1 ? "" : "s"} ` +
      `(phase >= ${ENFORCE_FROM_PHASE}), ${planFiles.length} total, no orphan assets.`,
  );
}

if (!enforceAll && (legacy.noVerification > 0 || legacy.bareItems > 0)) {
  console.log(
    `\n  note  legacy backlog (not enforced): ${legacy.noVerification} plan(s) with no ` +
      `Verification section, ${legacy.bareItems} with un-checkboxed items.` +
      `\n        Convert one at a time via OPT_IN in this script; "--all" to see them as failures.`,
  );
}

const total = problems.length + orphans.length;
console.log("");
if (total === 0) {
  console.log("Plan drift OK.");
  process.exit(0);
}
console.log(`Plan drift FAILED - ${total} problem${total === 1 ? "" : "s"}.`);
process.exit(1);
