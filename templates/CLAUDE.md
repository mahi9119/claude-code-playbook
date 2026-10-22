# <Project name> - agent constitution

> **How to use this template.** Copy it to your project root as `CLAUDE.md`. Delete every rule
> that does not apply. Replace anything in `<angle brackets>`. Keep the **Why** line on every rule
> you keep: a rule without its reason is the first thing the next person, or the next agent,
> "simplifies" away. Each Why below is a real incident from the project this playbook came from.

---

## 1. What this project is

<One paragraph: who uses it, what it does, how it is deployed, which database. The agent reads this
on every session, so make it the paragraph you would give a new senior engineer on day one.>

## 2. Commands

- `<dev command>` - start the dev server
- `<test command>` - unit and integration tests
- `<preflight command>` - every cheap check in order: lint, format, typecheck, guards, tests
- `<ship command>` - the one and only release path (see section 8)

---

## 3. Classify every task before starting

Every task is exactly one of these. When unsure which, ask.

| Tier | When | Process |
|---|---|---|
| **Bug** (`BUG-N`) | Existing behavior violates spec or expectation | Reserve the number in the tracker first, then fix, then a regression test |
| **Change Request** (`CR-N`) | A fully specified change: the requester has already decided every detail, and nothing below forces a plan | Tracker row, implement directly, review gate before ship |
| **Plan** | Everything else: real ambiguity, a restricted file, money, dates, recurrence or concurrency, or wide scope | Full plan file (section 4) before any code |

**Always a Plan, however simple it looks:** any change to `<schema file>`, `<auth file>`,
`<permissions file>`, `<tenant isolation file>`, or anything money, date, recurrence or
concurrency shaped.

**Why:** "This one is simple" was wrong often enough on exactly these files that the escalation is
now automatic. The cost of a plan is an hour. The cost of a wrong auth change is not.

---

## 4. Plan authoring guardrails

When a plan is approved, do these in order, before any code:

1. **Write the plan file first** to `docs/plans/Plan_<N>_<Topic>.md`.
2. **Reserve it in the tracker** with a link to the plan file, and bump the "next available
   number" line.
3. **Ask before the first edit.** Plan approval is not file-edit approval.

Every plan file contains (see `templates/plan.md`):

- **A summary table at the very top**, one row per sub-phase: `# | Sub-phase | Complexity |
  Model - Effort | Session | Why`. Score each row separately, never one model for the whole plan.
- **A session-split recommendation**, so risky changes never share a context with UI polish.
- **Numbered sections**, so any part can be referenced by number.
- **A review gate as its own sub-phase** (`N.1-R`) wherever a higher-model review is needed. Never
  fold the review into the build step.
- **A Boundary and Invariant Table** for every sub-phase touching dates, money,
  recurrence/scheduling, or ordering/concurrency:
  - Rows are the *hostile* inputs, not friendly ones. Dates: Jan 31 into February, leap February,
    year boundary, half-open `[start, end)` adjacency, drift across repeated runs. Money: rounding
    direction, zero, negative, credit-note sign. Concurrency: two triggers on two connections, a
    retry that re-reads.
  - The decision is pinned, not implied. "Calendar-month arithmetic" is ambiguous (overflow or
    clamp?). State which.
  - The assertion is falsifiable and precise. `end > start` is too weak;
    `monthIndex(end) - monthIndex(start) === cadence` catches a skipped month.
  - Concurrency rows name the database-enforced backstop (unique or exclusion constraint, and the
    isolation level). An application-level re-check inside a transaction is never enough on its
    own.
  - Check that the fixture actually discriminates. If two candidate formulas produce the same
    output on the row's input (a 50/50 split, round numbers, equal thirds), the row can never fail.
- **A Verification section of checkboxes** (`- [ ] ...`), never a plain numbered list. A phase
  cannot be marked complete with an unticked box: tick it with the evidence inline, or mark it
  `[~]` with a written reason.
- **A critical-files table** naming the files each sub-phase must touch, plus a link to any mockup
  it implements.

**Why:** A month-end date overflow shipped even though the plan named it as a risk, in a
sentence. Separately, a phase shipped without its approved UI deliverable while the plan's own
verification list named the exact miss, because a numbered prose list has no state that anyone,
or any script, can check. `guards/check-plan-drift.mjs` now blocks the ship.

---

## 5. Working practices

### 5.1 Plan before non-trivial work
Three or more steps, or an architectural decision, starts in plan mode. If something goes sideways
mid-task, stop and re-plan instead of patching forward. A wrong plan followed carefully is still
wrong.

### 5.2 Explore cheaply
Use targeted search and a code graph or index before reading whole files. Hand broad read-only
sweeps to a search subagent so the results stay out of the main context.

### 5.3 Verify before calling it done
Run the checks, read the logs, drive the real flow. Compare against what the code did before your
change, not only whether the diff compiles. Gate question: would a staff engineer approve this?

### 5.4 Fix bugs autonomously, but number them first
Given a bug report or a failing test, diagnose and fix it without asking for hand-holding. But the
moment a bug is confirmed, by anyone, in any context (triage, code review, incidentally), stop and
reserve its `BUG-N` in `<bug tracker path>` before touching a file. The commit cites the number.

**Why:** A code review once reported eight confirmed findings straight into the chat summary with
no numbers filed. The rule already covered it in words. It was not applied.

### 5.5 Capture lessons after every correction
When the user corrects a mistake, fix the pattern, not just the instance. Write it into
`docs/lessons.md` (newest first) in the same turn. Every entry must either:

- **name the mechanical guard** that now enforces it (test, script, hook, CI step), or
- **say `judgment`** and explain why no guard is feasible.

Every entry also adds a row to the index table at the top of the file. A `SessionStart` hook
injects that table into every session, so a missing row is an invisible lesson. If a `judgment`
lesson recurs, build its guard. Rewording the entry does not count.

**Why:** Rules that depend on someone remembering them fail exactly when they are needed.

### 5.6 Core principles
- **Simplicity first.** Make each change as simple as it can be and touch the minimum.
- **Find the root cause.** No temporary patches over a real defect.
- **Cheap checks fail fast first, expensive checks last.** Lint before the database suite, the
  database suite before the build, frontend validation before a database round trip. The cheap
  layer is an optimization, never a replacement: the database constraint stays the real
  enforcement.

---

## 6. Status and enum change checklist

Any change that adds, renames or removes a status value completes this before ship:

1. Search the whole source tree for every old literal.
2. Update every hit: compare-and-swap `WHERE` clauses, transition checks, button visibility,
   messages, audit event types and their from/to fields.
3. For each new value, confirm it is in the transition map, the UI action map, any progress
   stepper, the translation file, and the badge config.
4. When a new server action is copied from an old one, audit its toast key, audit event type,
   from/to fields, and the status in its `WHERE` clause.

**Why:** One phase shipped eight bugs at once this way. The type checker caught none of them: the
old literals were still valid values. They just meant the wrong state at runtime.

---

## 7. Pre-ship review gate

Every change is reviewed **before** the release command runs, never after.

- **Tier 1 - `/code-review`.** Every ship. Fix findings before shipping.
- **Tier 2 - a fresh-context adversarial review on a stronger model.** Required when the diff
  touches money, dates/recurrence, validation schemas, state machines, permissions or tenant
  isolation, concurrency, or spans 10+ source files. Drive it with the plan's Boundary and
  Invariant Table as a written hunt list: "produce outputs for THESE rows and confirm each
  assertion", never "review this phase". A reviewer that picks its own examples picks friendly
  ones. Use `agents/tier2-reviewer.md`.
- **Irreversible artifacts get their own gate.** If shipping runs a production migration, the
  migration is reviewed before the ship command is even shared. It can only be undone by a second
  migration. Use `agents/migration-reviewer.md`.

**Why:** Two internal triage sweeps missed five bugs that one independent adversarial review
caught. The misses were all the same kinds: timezone edges, hostile input, state sequences.

---

## 8. Shipping: one scripted path

Every commit goes through `<ship script>`. It formats, runs preflight, bumps the version, runs
migrations, commits and pushes, in that order, and stops on any failure.

- The agent never runs `git add`, `git commit` or `git push` directly. It hands over the one-line
  ship command. `hooks/block-git-write.mjs` enforces this.
- No AI attribution trailers in commit messages. The human who ships owns the commit.
- If migrations run during ship, they run **before** the push, and a failed migration stops the
  ship. A migration that reached `main` has not necessarily reached production.

**Why:** For two days, migrations that the ship script decided were "not schema changes" reached
`main` and never reached production. Dev was correct, CI was green, and the bug was marked fixed.
Production was missing its row-level security policies.

---

## 9. Third-party tool vetting

Before installing any package, skill, MCP server, extension or desktop tool that can read this
repo, check all six and report a verdict for each:

1. **License and provenance:** license, repo, stars, last commit. No license or no history means
   stop.
2. **Network egress:** search the installed code for `fetch(`, `http`, `axios`, `WebSocket`,
   `net.`, `dns`. Anything that sends file contents, paths, prompts or diffs off the machine means
   stop.
3. **Process execution:** `child_process`, `exec`, `spawn`, `eval`, `Function(`. Read these line
   by line.
4. **Hooks and auto-run:** did it add anything to `.claude/settings*.json`, git hooks or CI?
5. **Credential reach:** can it read `.env*` or any API key?
6. **Repo footprint:** every file it creates. A release script that stages everything will commit
   them.

Never install first and vet after. Never treat the vendor's README as evidence of what the code
does. Read the code that landed on disk.

---

## 10. Tracking docs: summary first, then detail

Every tracking doc (bugs, decisions, lessons, progress, routines) opens with a `## SUMMARY` table,
one row per item with a stable ID, followed by a `# DETAIL` section in the same order. Header and
row column counts must match.

**Why:** Detail-only trackers stop being read, and an unread tracker drifts. Enforced by
`guards/check-doc-tables.mjs`.

---

## 11. Engineering rules

<Your non-negotiables. Examples from the source project, each with its reason:>

1. **Schema changes go through the migration tool.** No hand-written DDL.
2. **No mocking the database in tests.** Use a real database. A mock tests the mock.
3. **Data isolation is enforced by the database** (row-level security), not by application code.
   Every write path goes through `<tenant wrapper>`.
4. **Money is `numeric`, never float.** Timestamps are stored in UTC and formatted at render time.
5. **Compare-and-swap updates compare against the value you read**, never a hardcoded literal:
   `WHERE status = before.status`. A literal still compiles after a rename and silently updates
   zero rows. Check the affected row count and return a conflict when it is zero.
6. **Every financial or compliance mutation writes an audit row.** Financial records are
   soft-deleted only.
7. **Every user-facing string goes through translation keys.**
8. **Ask before adding a dependency** (and then follow section 9).
9. **Every outbound email a human triggers shows a preview and confirm dialog** built from the
   exact same helpers as the real send, so preview and send can never drift.

---

## 12. Restricted modules

<List the files that carry extra guards: navigation, brand colors, schema, auth, permissions,
tenancy.> The first time a session touches one, warn once naming what its guard protects, then
proceed and run that guard. Warn once per session per module, not on every edit.

---

## 13. Model selection

Score each piece of work on how **under-specified** it still is, not on how scary it feels. A
fully pinned spec (invariant table written, decisions made) builds well on a cheaper model. Spend
the expensive model on the parts where something is still unknown: design, ambiguous diagnosis,
adversarial review. Always state the choice as `model - effort`.

**Why:** A usage audit showed the top-tier model consuming about half the spend on roughly an
eighth of the turns, mostly on work that was already fully specified.
