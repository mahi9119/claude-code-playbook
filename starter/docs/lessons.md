# Lessons

Every mistake we have made, newest first. The index between the markers is shown to Claude at the
start of every session, so add a row there for every new entry.

## SUMMARY

<!-- LESSONS-INDEX-START -->
| Date | Lesson | Guard |
|------|--------|-------|
| 2026-01-15 | Debug `console.log` lines were left in shipped code | `scripts/check-no-debug-logs.mjs`, run by `npm run check` |
<!-- LESSONS-INDEX-END -->

---

# DETAIL

## 2026-01-15 - Debug logs left in shipped code

**What happened.** A `console.log` added while debugging was committed and printed customer email
addresses into the server logs.

**The rule now.** No `console.log` in `src/`. Use the project's logger, or mark a deliberate line
with `// allow-console`.

**Guard.** `scripts/check-no-debug-logs.mjs` fails the check if one appears. Proven by adding a
`console.log` to a file, watching the check fail, and removing it.
