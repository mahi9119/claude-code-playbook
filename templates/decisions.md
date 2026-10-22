# Decisions

Architecture decision records. A `SessionStart` hook injects the summary table into every agent
session: before changing or reverting a pattern that looks odd, check whether an active decision
already explains why it exists.

Write an entry the moment a decision locks, not later. Write one whenever a change establishes a
pattern that someone could revert without knowing why.

## SUMMARY

| ID | Title | Date | Status |
|----|-------|------|--------|
| ADR-002 | New guards ship blocking but watermarked, never advisory but broad | 2026-01-20 | Active |
| ADR-001 | End-to-end tests run nightly and advise; they do not block every push | 2026-01-05 | Active |

---

# DETAIL

## ADR-002 - New guards ship blocking but watermarked, never advisory but broad

**Date:** 2026-01-20 | **Status:** Active

**Context.** Two earlier guards were built and then ignored. One ran as an advisory step that
printed warnings nobody read. The other was blocking but red on its first run against existing
files, so it was left out of the pipeline.

**Decision.** Every new guard is blocking from day one, scoped by a watermark (for example
"plans numbered 194 and above") so it binds new work and grandfathers the old. Legacy files are
opted in one at a time.

**Consequences.** The guard is green on day one and stays in the pipeline. The legacy backlog is
reported but not enforced, and shrinks as files are touched.

**Revisit when.** The legacy backlog reaches zero; then drop the watermark.

## ADR-001 - End-to-end tests run nightly and advise

**Date:** 2026-01-05 | **Status:** Active

**Context.** ...

**Decision.** ...

**Consequences.** ...
