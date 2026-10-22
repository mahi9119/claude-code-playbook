---
name: new-plan
description: >
  Author a new plan the right way - assign the next number, reserve it in the tracker, and write a
  compliant plan file - before any code is written. Use when the user approves a plan (plan mode
  accepted, or says GO / approve), asks to "plan N", "write the plan", "start a new phase", or wants
  to scope new work. Run the ordered steps before the first code edit.
---

## New plan - authoring guardrails

The moment a plan is approved, run these steps **in this exact order, before any code edit**. Plan
approval is not file-edit approval: confirm before the first change to any file the plan names.

---

### Step 1 - Assign the next number

1. Read `<tracker path>` (for example `docs/progress.md`).
2. Find the `Next available number: N` line. It is the authoritative source.
3. Use **N**. Never invent names like `SLA.1` or leave the work unnumbered.
4. Sub-numbers (`N.1`, `N.2`) are only for pieces of this one plan, grouped by dependency.
5. If the work spans several top-level numbers, reserve the whole contiguous range.

**On a branch behind `main`, the line is stale.** The real next number is
`max(this branch, origin/main) + 1`. Numbering collisions recurred three times before this was
written down.

---

### Step 2 - Write the plan file first

Save to `docs/plans/Plan_<N>[_to_<M>]_<Topic>.md`, using `templates/plan.md`. The filename spans the
full range, never just the first number.

The file must contain:

1. **Implementation Summary table at the top**: `# | Sub-phase | Complexity | Model - Effort |
   Session | Why`. Score each row separately. Pick the cheapest model that handles what is still
   unknown in that row.
2. **Session-split recommendation**, so risky work never shares a context with UI polish.
3. **Numbered sections** (`1. Context`, `2. Decisions` with `2.1`, `2.2`...).
4. **A review gate as its own row** (`N.1-R`) wherever a higher-model review is needed.
5. **A Boundary and Invariant Table** for any row touching dates, money, recurrence or concurrency:
   hostile inputs, pinned decisions, falsifiable assertions, and the database backstop for every
   concurrency row.
6. **A critical-files table** and a link to any mockup the plan implements.
7. **A Verification section of checkboxes**, never a plain list.

---

### Step 3 - Reserve it in the tracker

1. Add a Pending row: number, short name, owner, model - effort, and a **link to the plan file**.
2. Bump the `Next available number` line past the highest number you reserved.

---

### Step 4 - Confirm before the first edit

Tell the user which file you will touch first and what the change is, and wait for a yes.

---

### Design discipline while scoping

- Trace the full journey: who does what, when, and why. Gaps found now are cheap.
- List anything the plan removes from the UI. No silent removals.
- Flag any restricted file the plan touches (schema, auth, permissions, tenancy, navigation).
- Check the Decisions section against itself. Two approved decisions can contradict each other,
  and the code will silently pick one.
