# Plan <N>: <Topic>

**Status:** Draft | Approved | In progress | Shipped
**Mockup:** <link to the mockup or reference image this plan implements, or "none">

## Implementation Summary

| # | Sub-phase | Complexity | Model - Effort | Session | Why |
|---|-----------|------------|----------------|---------|-----|
| N.1 | <Schema and migration> | Medium | <Sonnet - High> | A | <Spec fully pinned by section 4> |
| N.1-R | Review gate for N.1 | Medium | <Opus - High> | B (fresh) | Touches money; driven by section 4 rows |
| N.2 | <UI> | Low | <Sonnet - Medium> | C | Mechanical once N.1 lands |

**Session split:** N.1 in session A. N.1-R in a fresh session B, so the reviewer does not share the
author's context. N.2 in session C, never mixed with the money change.

---

## 1. Context

<What problem this solves, for whom, and why now. Trace the full user journey end to end: who
does what, when, and why.>

## 2. Decisions

2.1 <Decision, stated so there is exactly one reading of it.>
2.2 <Decision.>

> Check the decisions against each other. Two approved decisions can contradict each other, and the
> code will silently pick one. "Never X" followed later by an exception to X is the usual shape.

## 3. Critical files

| Sub-phase | File | Change |
|-----------|------|--------|
| N.1 | `<path>` | <what changes> |
| N.2 | `<path>` | <what changes> |

## 4. Boundary and Invariant Table (N.1)

Required for any sub-phase touching dates, money, recurrence/scheduling, or ordering/concurrency.
Rows are hostile inputs. Each assertion is exactly what the property test encodes.

| # | Hostile input | Expected output | Falsifiable assertion (the test) |
|---|---------------|-----------------|----------------------------------|
| 1 | Monthly schedule anchored Jan 31, next period | Feb 28 (clamp, not overflow to Mar 3) | `next.month === 1 && next.day === 28` |
| 2 | Same, leap year | Feb 29 | `next.day === 29` |
| 3 | Anchor Jan 31, run 12 times | Each period lands on month-end; never drifts to the 28th | `periods.every(p => p.day === daysInMonth(p))` |
| 4 | Dec 15, monthly | Jan 15 of next year | `next.year === start.year + 1 && next.month === 0` |
| 5 | Two adjacent periods | `[start, end)` half-open, no overlap, no gap | `a.end.getTime() === b.start.getTime()` |
| 6 | Amount 100.00 split 3 ways | 33.34 / 33.33 / 33.33, residue on the first line | `sum(lines) === 100.00 && lines[0] === 33.34` |
| 7 | Credit note of -50.00 | Sign preserved through rounding | `round(-50.005) === -50.01` (pinned: half away from zero) |
| 8 | Two workers create the same invoice concurrently | Exactly one row | Unique index `<name>` on `(<cols>)`; second insert raises `23505` under READ COMMITTED |

**Discrimination check:** for each row, name the wrong implementation it would catch, and confirm
that implementation produces a different output on this exact input.

## 5. Verification

- [ ] Every Boundary and Invariant row has a passing test, named here: `<test file>`
- [ ] Each row mutation-tested: broke the implementation, watched the row go red, restored
- [ ] Database-backed tests ran with the database loaded (pass / skip / fail counts recorded; a skip is not a pass)
- [ ] Migration reviewed before ship by `migration-reviewer`
- [ ] Tier 2 review (N.1-R) verdict recorded: <SHIP / SHIP AFTER FIXES>
- [ ] UI matches the linked mockup, checked in a browser
- [ ] Every object the migration creates confirmed present in production by querying the schema

> Tick each box with its evidence inline. A box that was descoped is `[~]` with a written reason.
> Never tick a box you did not verify yourself.
