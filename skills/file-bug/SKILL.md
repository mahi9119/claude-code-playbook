---
name: file-bug
description: >
  Log a new bug the right way - tracker first, issue second, never the reverse. Use when the user
  wants to "file a bug", "log a bug", "raise a bug", "open an issue for this", or hands you a
  reproducible defect to record rather than fix now. This is the filing sequence, not the fixing one.
---

## File bug - filing sequence

**The tracker is the single source of bug numbers.** Reserve the number there first, then open the
issue. An issue opened first creates numbering collisions.

---

### Step 1 - Reserve the number

1. Open `<bug tracker path>`. Re-read it now; do not trust a number you remember.
2. Take the number on its `Next new bug starts at BUG-N` line, and check it against the highest
   existing `BUG-N` in the file.
3. Add a row: **BUG-N**, short title, area, severity, status, today's date, one-line repro.
4. Bump the `Next new bug starts at` line.

---

### Step 2 - Make it reproducible

Before filing anywhere else, the entry needs:

- **Steps to reproduce**, numbered, from a known starting state (which user role, which page).
- **Expected vs actual**, one line each.
- **Scope**: which area, and whether it touches money, timestamps or tenant data. Those raise
  severity.
- **Evidence**: error text, screenshot path, or failing test name.

If any of these are missing and you cannot find them yourself, ask. Do not file a vague bug.

---

### Step 3 - Open the issue

Title it `BUG-N: <short title>` so tracker and issue stay linked. Put the Step 2 content in the
body. Then paste the issue URL back into the tracker row.

---

### Step 4 - Do not fix in this flow

Filing is not fixing. Once the bug is logged and cross-linked, stop and ask whether to fix it now
or leave it in the backlog. Never start editing code from a filing request.
