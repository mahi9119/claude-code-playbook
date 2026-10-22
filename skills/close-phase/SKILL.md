---
name: close-phase
description: >
  Close a pending phase or plan only on evidence from the running system - either by updating the
  tracker when the work is already built and verified live, or by finishing its outstanding
  verification items and handing over the ship command. Use when the user says "close phase N",
  "close the pending phases", "what would it take to ship N", or "work the backlog in order".
  Never ships anything itself.
---

## Close phase - drive one pending phase to a real close

A pending phase closes exactly two ways:

- **Route A - tracker only.** The code is built, on `main`, and **verified present in
  production**. Close it by moving the tracker row with evidence.
- **Route B - finish the work.** Real items remain: unbuilt code, unrun reviews, unverified
  behavior. Do them, resolve every Verification checkbox, then hand over the ship command.

This skill exists to prevent **Route A claimed when Route B is true.** A plan file, a generated
migration, or a file existing in git all look identical to shipped work. Every Route A close needs
positive evidence from the running system.

**One phase per session.** Do not batch, and do not run this on a loop.

---

### Step 0 - The working tree must be clean

If your ship script stages everything, any unrelated file in the tree ships under this phase's
name. Run `git status --short` first. If anything is there that this phase did not produce, show
it to the user, say whose it looks like, and stop. Do not decide for them, and do not quietly
fence it off.

---

### Step 1 - Read the real state

Read the tracker row in full, then the plan's Verification section. Treat the tracker's comments as
a claim made at some past moment, and verify each one.

---

### Step 2 - Establish what is true, cheapest check first

Stop as soon as something rules out Route A.

1. **Is the code on `main`?** `git log --oneline -- <paths>`. This is the weakest evidence: it
   only proves the code was written.
2. **Does it build?** Typecheck and lint. Report exit codes.
3. **Do its tests pass with the database loaded?** Report pass, skip and fail counts separately.
   **A skip is not a pass.** If the phase's verification depends on a suite that skipped, the item
   is unverified.
4. **Is it live in production?** Ask the production schema itself, never the migration ledger and
   never the tracker. A ledger records what was attempted, not what exists. Reading production
   needs the user's explicit permission in the current turn. Never write to it from this skill.

---

### Step 3 - Route A: close on the tracker

Only if all of these hold:

- Code on `main`; typecheck and lint clean.
- Every Verification item is `[x]` with inline evidence, or `[~]` with a descope reason the user
  agreed to. Never tick a box you did not verify yourself.
- The phase's own tests ran green with the database loaded: real passes, not skips.
- Every object the phase created is confirmed in production by querying the schema.
- No open high-severity bug cites this phase as its cause.

Then update the tracker and hand over a docs-only ship command.

---

### Step 4 - Route B: finish the outstanding items

Cheapest first.

- **Unbuilt code** is not a close, it is a build. Stop and say so. It needs a planned build
  session.
- **Verification items you can satisfy now:** run them, then tick each box with the command, the
  counts, the exit code and the date written inline.
- **Checks that need a browser or the user's own session:** run what you can and ask for the rest.
  Never mark a box done from reading the code, or because it should work.
- **Tier 2 review gates:** spawn a fresh agent (`agents/tier2-reviewer.md`) driven by the plan's
  Boundary and Invariant Table as a hunt list. Give it an explicit read-only brief, name the files
  it must not touch, and run `git status --short` when it returns. A "read-only" agent once
  modified the ship script and wrote five new files.
- **Owner decisions** (schema sign-off, permissions, anything touching production): present the
  evidence and the options. Do not let a pending decision quietly become a tick.

Then run the Tier 1 `/code-review` and resolve its findings.

---

### Step 5 - Hand over the ship command

Confirm the plan-drift guard passes, then give one line: the ship command. Never run it yourself.

---

### Never

- Ship, push or commit.
- Close on the strength of a file in git, a ledger entry, or a plan's own claim.
- Treat a skipped test as a passing one.
- Read or write production without permission in the current turn.
