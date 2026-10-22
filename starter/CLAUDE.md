# Project rules for Claude

## About this project

<Two or three sentences: what it is, who uses it, the language and framework.>

## Commands

- Run the app: `<command>`
- Run the tests: `<command>`
- Run every check before committing: `npm run check`

## How we work

1. **Plan first.** For anything with three or more steps, propose a plan and wait for a yes
   before editing files.
2. **Verify before saying done.** Run the tests and the checks, and show me the result.
3. **Fix the cause, not the symptom.** No temporary patches.
4. **Ask before adding a dependency.**
5. **Don't commit or push unless I ask.**

## Lessons

`docs/lessons.md` holds every mistake we have already made. Its index is shown to you at the
start of each session; read the full entry when a row matches what you are about to do.

When I correct a mistake, add an entry to `docs/lessons.md` in the same turn, with:

- what went wrong,
- the rule now,
- the guard: the test or script that catches it next time, or `judgment` and why no check is
  possible.

## Rules for this codebase

<Add one line each time you correct the same thing twice. Keep the reason with the rule.>

- Example: money is stored as integer cents, never as floats. Why: float rounding produced an
  invoice that was off by one cent.
