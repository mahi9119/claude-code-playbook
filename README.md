<p align="center">
  <img src="assets/cover.svg" alt="Claude Code Playbook: guards over reminders" width="100%">
</p>

# Claude Code Playbook

How we shipped a production-grade financial SaaS with Claude Code, and the guardrails that made
it safe to do so.

This repo is the method, not the product. It holds the project constitution, skills, reviewer
agents, hooks, guard scripts and incident stories we built while developing a multi-tenant B2B
SaaS for billing, contracts and compliance. Everything here is generic and ready to copy into your
own project.

**Live write-up:** [mahi9119.github.io/claude-code-playbook](https://mahi9119.github.io/claude-code-playbook/)

**New to Claude Code?** Start with the [beginner guide](https://mahi9119.github.io/claude-code-playbook/start.html):
six steps from an empty project to rules, a lessons log, a first guard, plans and reviews, using
the small files in [`starter/`](starter).

---

## The numbers

Measured against the private product repository on 22 October 2026.

| | |
|---|---|
| Time span | 17 Apr 2026 to today, about 6 months |
| Commits | 956 |
| Application code | 149,919 lines of TypeScript across 834 files |
| Test code | 44,973 lines across 247 files |
| Database migrations | 162 |
| Delivery phases planned and tracked | 209 |
| Bugs tracked / fixed | 433 / 316 |
| Lessons logged after a mistake | 80, of which 46 are now enforced by a script or test |
| Architecture decision records | 30 |
| Project skills / reviewer agents | 22 / 4 |

The product is deployed and production-ready, and pre-launch: no paying clients yet. Claude Code wrote most of the keystrokes. We wrote the rules it works under,
reviewed what it shipped, and own every decision. That last part is what this repo is about.

---

## The one idea: guards over reminders

An AI coding agent forgets. So do people. A rule that lives only in a prose document holds until
the day it matters, then it gets skipped by whoever, or whatever, read a different document.

So every mistake in this project goes through the same loop:

<p align="center">
  <img src="assets/the-loop.svg" alt="Incident, then a lesson logged, then a guard built, then the guard blocks the next attempt, while a session-start hook injects the lesson index into every new session" width="100%">
</p>

1. **Incident.** Something breaks, or nearly does.
2. **Lesson.** It is written into `lessons.md` the same turn, with one hard requirement: name the
   mechanical guard that now enforces it, or write the honest word `judgment` and say why no guard
   is possible.
3. **Guard.** A test, script, hook or CI step that fails loudly when the mistake is repeated.
4. **Recall.** A `SessionStart` hook injects the lesson index into every new Claude session, so
   the lessons that could not be automated are at least in front of the agent at the moment it
   starts work.

A `judgment` lesson that recurs twice stops being a lesson and becomes a build task for its guard.
Rewording it does not count.

---

## The method, in nine rules

Each rule exists because something specific went wrong. The incident is the reason, and it is
written next to the rule in the constitution so nobody "simplifies" the rule away later.

| # | Rule | The incident that made it |
|---|------|---------------------------|
| 1 | **A written constitution** (`CLAUDE.md`) that every session loads | Repeating the same correction in session after session |
| 2 | **Classify every task first:** Bug, Change Request, or full Plan | Simple-looking changes to auth and schema files that were not simple |
| 3 | **Plans carry a Boundary and Invariant Table** for anything touching money, dates or concurrency | A month-end date overflow shipped even though the plan named it as a risk, in prose |
| 4 | **Verification items are checkboxes**, and a guard blocks shipping with one unticked | A phase shipped without its approved UI deliverable while the plan's own checklist named the miss |
| 5 | **Pick the cheapest model that handles what is still unknown** | Paying top-tier rates for work whose spec was already fully pinned down |
| 6 | **Two-tier review before every ship**, with a fresh-context adversarial reviewer for risky diffs | Internal triage sweeps missed five bugs that an independent reviewer found |
| 7 | **One scripted release path**, and a hook that blocks the agent from running `git commit` itself | Migrations that reached `main` but silently never reached production |
| 8 | **Vet every third-party tool before install**, six checks, read the code on disk | Any skill or MCP server that reads the repo is a potential code leak |
| 9 | **Tracking docs open with a summary table**, linted for alignment | Detail-only trackers stop being read, which is where tracker drift starts |

<p align="center">
  <img src="assets/task-tiers.svg" alt="Every task is classified as a Bug, a Change Request or a Development Plan, each with a different amount of process" width="100%">
</p>

<p align="center">
  <img src="assets/review-gates.svg" alt="The release pipeline: cheap checks first, then the Tier 1 review, then a Tier 2 fresh-context review and a migration review only when the diff calls for them, then one scripted ship" width="100%">
</p>

---

## What's in this repo

```
claude-code-playbook/
├── starter/                 Beginner kit: short CLAUDE.md, lessons log, session hook, first guard
├── templates/
│   ├── CLAUDE.md            The constitution: every rule with the reason it exists
│   ├── plan.md              Plan file shape: summary table, invariant table, checkbox verification
│   ├── lessons.md           Lessons log: index table plus entry format and the promotion rule
│   └── decisions.md         ADR log: summary table plus detail
├── skills/
│   ├── new-plan/            Number, reserve and write a plan before any code
│   ├── file-bug/            Tracker row first, issue second, never the reverse
│   ├── close-phase/         Close a phase only on evidence from the running system
│   └── overnight-close/     Unattended backlog work with a written authority boundary
├── agents/
│   ├── tier2-reviewer.md    Adversarial reviewer driven by the invariant table
│   ├── migration-reviewer.md  Pre-ship gate for irreversible schema changes
│   └── invariant-scanner.md Sweeps the codebase for constitution violations
├── hooks/
│   ├── settings.example.json  SessionStart injection + PreToolUse git block
│   └── block-git-write.mjs  Stops the agent from committing outside the release script
├── guards/
│   ├── check-plan-drift.mjs Planned-but-never-built deliverables fail the build
│   └── check-doc-tables.mjs Tracking docs must open with a summary, tables must align
├── stories/
│   └── README.md            Twelve incidents and the guards they produced
├── site/
│   ├── index.html           The write-up, served by GitHub Pages
│   └── start.html           The beginner guide
└── MAINTAINING.md           Decisions, content rules, and how to refresh the numbers and site
```

---

## Quick start

You do not need all of it. Start with the two pieces that pay back fastest.

**1. Copy the constitution and cut it down.**

```bash
cp templates/CLAUDE.md /path/to/your-project/CLAUDE.md
```

Delete every rule that does not apply to you. Keep the reasons on the ones you keep. A rule
without its reason gets "cleaned up" by the next person, or agent, who does not know why it is
there.

**2. Start a lessons log and inject it at session start.**

```bash
cp templates/lessons.md /path/to/your-project/docs/lessons.md
```

Merge the `SessionStart` block from `hooks/settings.example.json` into your project's
`.claude/settings.json`. From then on, every new session begins by reading what went wrong before.
If you also want the git-write block, copy `hooks/block-git-write.mjs` to `scripts/hooks/` and
merge the `PreToolUse` block too.

**3. Add guards as incidents earn them.** Do not install every guard on day one. Each one here
exists because of a specific failure. Wait for yours, then build the guard in the same commit as
the fix.

Skills go in `.claude/skills/<name>/SKILL.md`, agents in `.claude/agents/<name>.md`. Both are
written so that the project-specific parts are marked `<like this>`.

---

## Principles that hold the whole thing together

- **Blocking but narrow beats advisory but broad.** An advisory check gets ignored. A blocking
  check that is red on day one gets switched off. So new guards are blocking and watermarked: they
  bind new work and grandfather the old, which gets converted one file at a time.
- **Cheap checks first, expensive checks last.** Lint and typecheck before the database test
  suite, the database suite before the build, code review before a browser test.
- **A skipped test is not a passing test.** A suite that silently skips a fifth of itself reports
  green.
- **Prove the guard can fail.** Mutate the code, watch the guard go red, restore. A guard that has
  never been red has never been tested.
- **Process exceptions are not judgement exceptions.** "Ship it yourself overnight" removes the
  wait between steps. It does not hand over decisions that belong to someone else.

---

## About

Built by [Mahendar Mali](https://www.linkedin.com/in/mahendar-mali). Questions, ideas and pull
requests are welcome.

Released under the [MIT License](LICENSE). Not affiliated with or endorsed by Anthropic. Claude
and Claude Code are products of Anthropic.
