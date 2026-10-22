# Lessons

The incident log. Newest first. A `SessionStart` hook injects the index table below into every
agent session, so every new entry must also add an index row in the same edit.

**The promotion rule.** Every entry names the mechanical guard that now enforces it (test, script,
hook, CI step), or says `judgment` and explains why no guard is feasible. This file is the
incident log, not the enforcement layer. If a `judgment` lesson recurs, build the guard. Rewording
the entry does not count.

## SUMMARY

<!-- LESSONS-INDEX-START -->
| Date | Lesson | Guard | Read the full entry before |
|------|--------|-------|----------------------------|
| 2026-01-15 | A skipped test is not a passing test: the database suite skipped silently because its env file never loaded | `ci/db-required.yml` runs the suite with the database and asserts no skips | trusting a green suite; adding a skip condition |
| 2026-01-09 | A guard whose exemption branch was never tested let the exact bug class through | `judgment` - proving a guard red on the pre-fix code is a discipline no test can force | writing or relaxing any skip or allowlist in a guard |
<!-- LESSONS-INDEX-END -->

Guard coverage: 1 of 2 automated.

---

# DETAIL

## 2026-01-15 - A skipped test is not a passing test

**What happened.** <Plain account. What broke, how long it was broken, how it was found.>

**Why it happened.** <The root cause, not the symptom.>

**The rule now.** <One or two sentences a future reader can apply.>

**Guard.** <Exact file and what it asserts. How it was proven: "reverted the fix, the guard went
red, restored".> Or: `judgment`, because <why no script can see this>.

**Read this before.** <The situations where this lesson applies.>

## 2026-01-09 - A guard's exemption branch is untested code

**What happened.** ...
