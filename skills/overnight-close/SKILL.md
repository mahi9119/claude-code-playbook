---
name: overnight-close
description: >
  Work the backlog unattended - the owner is asleep or away, has granted the ship exception, and
  expects real progress by morning without being woken for decisions. Use when they say "work the
  backlog overnight", "you make the decisions and ship yourself", "park blockers and proceed", or
  start a /loop over the pending tables. Encodes the authority boundary, the park protocol, the
  per-tick order, and the morning handover.
---

## Overnight close - real progress while nobody is watching

The value of an unattended run is waking up to more closed than you left, plus a handover you can
trust without re-deriving anything. The risk is that the run makes a decision that was never its to
make, ships it, and the mistake is found a week later in money.

This skill is mostly about the risk.

---

## 1. Authority - what the exception covers

"Make the decisions and ship yourself" is a **process** exception, not a **judgement** exception.
It removes the wait between steps. It does not transfer decisions that belong to someone else.

| Decision | Unattended? | Why |
|---|---|---|
| Which item next, in what order | **Yes** | Sequencing is the point of the run |
| Engineering conventions (test shape, naming, refactors) | **Yes** | Reversible and cheap to revisit |
| Running the ship script, including its migration step | **Yes** | This is exactly what the exception grants |
| Filing a bug, writing an ADR, writing a plan | **Yes** | Recording is never the risky act |
| Anything a tracker row assigns to a **named other person** | **No - park** | Not the owner's to delegate on their behalf |
| A money or billing meaning (when a fee applies, which line absorbs a rounding residue) | **No - park** | The wrong answer is found on a client's invoice |
| Deleting data, or a migration that drops or rewrites rows | **No - park** | Irreversible |
| Reverting something an active ADR explains | **No - park** | The ADR is the record of why it looks odd |

**The test:** if being wrong costs a conversation, decide it. If being wrong costs money, a
client, or someone else's authority, park it.

---

## 2. Park protocol - a parked item costs the morning nothing

For every park, in the same tick:

1. **Update the tracker row** with the blocker in plain words and **what you will do the moment it
   clears**. Never just "blocked".
2. **Name the decider:** the owner, a named person, or "needs an artifact" (a spreadsheet, a
   seeded record, a live browser).
3. **Do the unblocked remainder first.** If three of four verification items pass, tick those
   three with evidence and park only the fourth.

Never invent a result to clear a checkbox. `[~]` with a written reason is an honest close.

---

## 3. Each tick

Each tick ends with a clean tree and `main` pushed. Assume the next tick remembers nothing: the
trackers and the commit log are the handoff.

1. **Re-read state:** recent commits, `git status`, the pending tables, the next bug number.
2. **Pick one item** using the order in section 4.
3. **Work it to a real close:** code, tests, verification, Tier 1 review, and a Tier 2 review in a
   fresh context where the diff calls for one.
4. **Ship it** with the ship script.
5. **Update the trackers in the same tick.** Shipping code and leaving the tracker stale creates
   exactly the drift the guards exist to catch.
6. **Log the tick** in the handover: what closed, what parked, what is next. A quiet tick honestly
   reported is fine.

If a tick runs out of road mid-item, finish the increment and ship it, or revert it. Never leave
half-done work for the next tick to find.

---

## 4. Order: unblock first, then cheapest, then heaviest

1. **Unblockers**: a seed script, a missing fixture, a broken test hiding a suite. One unblocker
   can open three items.
2. Items whose blocker is a script run, not a decision.
3. Open bugs, highest severity first.
4. Phases with built code and outstanding verification.
5. Phases needing new code, smallest first.
6. Writing plans for reserved placeholders. This is legitimate unattended progress, and it makes
   the next attended session shorter.

---

## 5. The morning handover

Publish one handover page at the start and update the same page each tick, so the link never
changes. It answers, in this order:

- What is different since last night: versions shipped, items closed, bugs fixed.
- What is parked, who decides it, and what happens once they do.
- What the owner has to do personally, as a list of actions.
- The exact state: version, branch, clean tree, next bug number, next plan number.

Lead with the one thing that matters most, even when it is bad news.

---

## 6. Standing rules still apply at 3am

- Bug number before the first edit.
- Restricted files still warn once and still run their guard.
- Load the database before trusting a test run. A green suite that skipped a fifth of itself is
  not green.
- Log lessons for anything that will recur, with a guard named or the word `judgment`.

---

## 7. Stopping

Stop when the queue holds only parked items, or everything left needs the owner's browser or
decision. Say so plainly. A loop that keeps firing on an empty queue spends quota to report that
there is nothing to do.

Do not stop early because what is left looks hard. Hard is what the night is for.
